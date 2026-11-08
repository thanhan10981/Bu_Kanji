"""Render user-supplied exam PDFs without OCR. Requires PyMuPDF, only at import time.

Run: python scripts/import-exam-pdfs.py --sources-root <folder containing the six PDFs>
The original PDFs are read only. Scripts are used exclusively for post-submit review.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import pymupdf

SOURCES = {
    'exam-2025-07': ('16. N3 7-2025.pdf', '16. N3-7-2025(script).pdf', 26, 11),
    'exam-2025-12': ('17.N3 12-2025 (261102).pdf', '17.N3 12-2025 (script) _260410.pdf', 29, 12),
    'exam-2026-07': ('18. N3 7-2026 (261021).pdf', 'Script Nghe N3 T7-2026 Mark.pdf', 30, 10),
}
# Inclusive page ranges manually checked on contact sheets and the original layouts.
RANGES = {
    'exam-2025-07': [(1,1),(2,2),(3,4),(4,4),(5,5),(6,8),(8,8),(9,9),(10,12),(13,15),(15,17),(18,19),(20,21),(22,23),(23,23),(24,25),(26,26)],
    'exam-2025-12': [(1,1),(2,2),(3,4),(4,4),(5,6),(6,8),(9,9),(10,11),(12,15),(16,18),(19,20),(21,22),(23,24),(25,26),(26,26),(27,28),(29,29)],
    'exam-2026-07': [(1,1),(2,2),(2,3),(4,4),(4,5),(6,8),(8,9),(9,10),(11,14),(15,17),(18,20),(20,22),(23,24),(25,26),(27,27),(28,29),(30,30)],
}
SCRIPT_RANGES = {
    'exam-2025-07': [(1,3),(3,7),(7,8),(9,9),(10,11)],
    'exam-2025-12': [(1,4),(5,7),(8,9),(10,10),(11,12)],
    'exam-2026-07': [(1,3),(4,6),(7,8),(8,9),(9,10)],
}
# Start at the question, or at its shared reading passage. All group pages remain available.
INITIAL = {
    'exam-2025-07': {3:[3]*10+[4],6:[6]*6+[7]*7,9:[10,11,12,12],10:[13]*3+[14]*3,11:[16]*4,13:[20]*4+[21]*2,14:[22]*5+[23],16:[24]*2+[25]*2},
    'exam-2025-12': {3:[3]*9+[4]*2,5:[5]*4+[6],6:[6]*4+[7]*5+[8]*4,9:[12,13,14,15],10:[16]*3+[17]*3,13:[23]*3+[24]*3,14:[25]*4+[26]*2,16:[27]*2+[28]*2},
    'exam-2026-07': {3:[2]*3+[3]*8,5:[4]+[5]*4,6:[6]*7+[7]*5+[8],7:[8]*4+[9],9:[11,12,13,14],10:[15]*3+[16]*3,13:[23]*2+[24]*4,14:[25]*4+[26]*2,16:[28]*2+[29]*2},
}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--sources-root', type=Path, required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    manifest = {'formatVersion': 1, 'exams': {}}
    for exam, (question_name, script_name, question_count, script_count) in SOURCES.items():
        target = root/'public'/'exams'/exam
        target.mkdir(parents=True, exist_ok=True)
        entry = {'sections': {}}
        for kind, name, expected in [('questions',question_name,question_count),('script',script_name,script_count)]:
            matches = [p for p in args.sources_root.rglob('*.pdf') if p.name == name]
            if len(matches) != 1:
                raise ValueError(f'Expected exactly one {name}; found {len(matches)}')
            source = matches[0]
            doc = pymupdf.open(source)
            if len(doc) != expected:
                raise ValueError(f'Unexpected page count: {name}')
            pages = {}
            directory = target/kind
            directory.mkdir(exist_ok=True)
            for index, page in enumerate(doc):
                path = directory/f'page-{index+1:02}.png'
                pixels = page.get_pixmap(matrix=pymupdf.Matrix(2.5,2.5), alpha=False)
                pixels.save(path)
                pages[str(index+1)] = {'page':index+1, 'src':f'/exams/{exam}/{kind}/{path.name}',
                    'width':pixels.width, 'height':pixels.height,
                    'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
            entry[kind] = {'fileName':name, 'sha256':hashlib.sha256(source.read_bytes()).hexdigest(), 'pages':pages}
            if kind == 'questions':
                shutil.copyfile(source, target/'questions.pdf')
                entry[kind]['pdfUrl'] = f'/exams/{exam}/questions.pdf'
        draft = json.loads((root/'src/data/exams'/f'{exam}.json').read_text(encoding='utf8'))
        for index, section in enumerate(draft['sections'], start=1):
            start,end = RANGES[exam][index-1]
            initial = INITIAL[exam].get(index, [start]*len(section['questions']))
            assert len(initial) == len(section['questions'])
            assert all(start <= p <= end for p in initial)
            review = SCRIPT_RANGES[exam][index-13] if index >= 13 else None
            entry['sections'][section['sectionId']] = {
                'pages':list(range(start,end+1)),
                'initialPageByQuestion':{q['questionId']:p for q,p in zip(section['questions'],initial)},
                'scriptPages':list(range(review[0],review[1]+1)) if review else [],
                'choiceCount':3 if index in (16,17) else 4,
            }
        manifest['exams'][exam] = entry
        print(f'{exam}: {question_count} original pages + {script_count} script pages')
    (root/'src/data/exams/source-pages.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')

if __name__ == '__main__':
    main()
