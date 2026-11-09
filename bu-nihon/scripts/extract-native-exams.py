"""Extract main text and original ruby by geometry, not plain-text reading order.
Requires PyMuPDF only at import time. Original PDFs are never modified.
"""
import argparse, json, re, runpy, hashlib, unicodedata
from pathlib import Path
import pymupdf

CONFIG = runpy.run_path(str(Path(__file__).with_name('import-exam-pdfs.py')))
KANJI = re.compile(r'[\u3400-\u9fff々]')

def normalize(text):
    return unicodedata.normalize('NFKC', text)

def page_rows(page, number):
    chars=[]; small=[]
    for block in page.get_text('rawdict')['blocks']:
        for line in block.get('lines',[]):
            for span in line['spans']:
                if span['size'] < 9:
                    text=''.join(c['c'] for c in span['chars']).strip()
                    if text: small.append((span['bbox'], re.sub(r'\s+', '', text)))
                else:
                    for c in span['chars']:
                        if 57 < c['bbox'][1] < page.rect.height-35:
                            chars.append(dict(c))
    rows=[]
    for char in sorted(chars,key=lambda c:(c['bbox'][3],c['bbox'][0])):
        y=char['bbox'][3]
        if not rows or abs(rows[-1]['y']-y)>7:
            rows.append({'page':number,'y':y,'chars':[]})
        rows[-1]['chars'].append(char)
    underlines=[]
    for drawing in page.get_drawings():
        rect=drawing['rect']
        if rect.height<1.5 and rect.width>8:
            underlines.append(rect)
    for row in rows:
        row['chars'].sort(key=lambda c:c['bbox'][0])
        while row['chars'] and row['chars'][0]['c'].isspace():row['chars'].pop(0)
        while row['chars'] and row['chars'][-1]['c'].isspace():row['chars'].pop()
        for c in row['chars']:
            x=(c['bbox'][0]+c['bbox'][2])/2
            c['u']=any(r.x0<=x<=r.x1 and 0<=r.y0-c['bbox'][3]<=4 for r in underlines)
        row['ruby']=[]
        for box,reading in small:
            if 0 <= min(c['bbox'][1] for c in row['chars'])-box[3] <= 5 if row['chars'] else False:
                matching=[i for i,c in enumerate(row['chars']) if KANJI.search(c['c']) and box[0]-2 <= (c['bbox'][0]+c['bbox'][2])/2 <=box[2]+2]
                if matching:row['ruby'].append((min(matching),max(matching)+1,reading))
        row['text']=''.join(c['c'] for c in row['chars'])
        row['x']=row['chars'][0]['bbox'][0] if row['chars'] else 999
    return [r for r in rows if r['text'].strip() and not (normalize(r['text'].strip())==str(number) and r['x']>page.rect.width*0.4 and r['y']>page.rect.height-95)]

def group_rows(doc, allrows, start, end, problem):
    rows=[r for p in range(start,end+1) for r in allrows[p]]
    heading=re.compile(r'^問題\s*([1-7])')
    own=next((i for i,r in enumerate(rows) if (m:=heading.match(normalize(r['text']))) and int(m[1])==problem),None)
    if own is not None:rows=rows[own:]
    following=next((i for i,r in enumerate(rows[1:],1) if (m:=heading.match(normalize(r['text']))) and int(m[1])!=problem),len(rows))
    return rows[:following]

def part(row, start=0, end=None):
    end=len(row['chars']) if end is None else end
    return {**row,'chars':row['chars'][start:end],
        'ruby':[(max(a,start)-start,min(b,end)-start,r) for a,b,r in row['ruby'] if a>=start and b<=end]}

def rich(rows):
    tokens=[]
    for row in rows:
        chars=row['chars']; readings={a:(b,r) for a,b,r in row['ruby']}
        i=0
        while i<len(chars):
            if i in readings:
                end,reading=readings[i]; text=''.join(c['c'] for c in chars[i:end])
                tokens.append({'text':text,'reading':reading,**({'underline':True} if any(c['u'] for c in chars[i:end]) else {})});i=end;continue
            c=chars[i];text=c['c']; underline=c['u']
            if text.isspace() and not underline and i and i+1<len(chars) and KANJI.search(chars[i-1]['c']) and re.search(r'[\u3040-\u9fff]',chars[i+1]['c']):
                i+=1;continue
            if tokens and not tokens[-1].get('reading') and bool(tokens[-1].get('underline'))==underline:
                tokens[-1]['text']+=text
            else:tokens.append({'text':text,**({'underline':True} if underline else {})})
            i+=1
        tokens.append({'text':'\n'})
    while tokens and not tokens[0]['text'].strip():tokens.pop(0)
    while tokens and not tokens[-1]['text'].strip():tokens.pop()
    if tokens:
        tokens[0]['text']=tokens[0]['text'].lstrip();tokens[-1]['text']=tokens[-1]['text'].rstrip()
    return [t for t in tokens if t['text']]

def plain(tokens):return ''.join(t['text'] for t in tokens)

def parse_options(block):
    candidates=[]
    for ri,row in enumerate(block[1:],1):
        text=''.join(c['c'] for c in row['chars'])
        for match in re.finditer(r'(?<!\S)([1-4１-４])(?![0-9０-９])\s*',text):
            previous=next((c for c in reversed(row['chars'][:match.start()]) if c['c'].strip()),None)
            # Dates/counts inside an option are not new choice labels. Printed columns
            # start a row or have a real horizontal gutter before the numbered label.
            if previous and row['chars'][match.start()]['bbox'][0]-previous['bbox'][2]<15:continue
            candidates.append((int(normalize(match[1])),ri,match.start(),match.end()))
    chosen=[]
    for candidate in candidates:
        if candidate[0]==1:chosen=[candidate]
        elif chosen and candidate[0]==len(chosen)+1:chosen.append(candidate)
        if len(chosen)==4:break
    if len(chosen)!=4:return None
    def region(start,end):
        ri,ci=start;er,ec=end
        return [part(block[r],ci if r==ri else 0,ec if r==er else None) for r in range(ri,er+1)]
    stem=region((0,0),(chosen[0][1],chosen[0][2]))
    choices={}
    for i,candidate in enumerate(chosen):
        _,ri,_,end=candidate
        if i<3:next_end=(chosen[i+1][1],chosen[i+1][2])
        else:
            last=ri
            label_x=block[ri]['chars'][candidate[2]]['bbox'][0]
            for j in range(ri+1,len(block)):
                if block[j]['x']<label_x-5:break
                last=j
            next_end=(last,len(block[last]['chars']))
        choices[str(i+1)]=rich(region((ri,end),next_end))
    last_row=next_end[0]
    return rich(stem),choices,block[last_row+1:]

def illustration(doc, root, exam, qid, page, rect, count=1):
    target=root/'public/exams'/exam/'native';target.mkdir(exist_ok=True)
    path=target/f'{qid}-{count}.png';pixels=doc[page-1].get_pixmap(matrix=pymupdf.Matrix(2.5,2.5),clip=rect,alpha=False);pixels.save(path)
    return {'src':f'/exams/{exam}/native/{path.name}','width':pixels.width,'height':pixels.height,'alt':f'Hình gốc của câu {qid}, trang {page}'}

def extract_exam(root,exam,doc,allrows):
    raw=json.loads((root/'src/data/exams'/f'{exam}.json').read_text(encoding='utf8'))
    sections={};failures=[]
    for n,section in enumerate(raw['sections'],1):
        sid=section['sectionId'];start,end=CONFIG['RANGES'][exam][n-1]
        problem=n if n<=5 else n-5 if n<=12 else n-12
        rows=group_rows(doc,allrows,start,end,problem)
        expected=[int(q['originalNumber']) for q in section['questions']]
        anchors={}
        for i,row in enumerate(rows):
            text=normalize(row['text'])
            match=re.match(r'^[.．]?(\d+)\s*番[.．]?',text) if n>=13 else re.match(r'^(\d+)(?:\s|\.|$)',text)
            if match and int(match[1]) in expected and row['x']<97:
                value=int(match[1])
                if value not in anchors:anchors[value]=(i,match.end())
        if n in (15,17):anchors={}
        if n not in (15,17) and len(anchors)!=len(expected):
            failures.append(f'{exam}/{sid} missing anchors {set(expected)-set(anchors)}')
        first=min((i for i,_ in anchors.values()),default=len(rows))
        prefix=rows[:first];instruction=[]
        for row in prefix:
            instruction.append(row)
            if 'なさい' in row['text'] or 'ください' in row['text']:break
        if n>=13:
            instruction=[]
            for row in prefix:
                if 'メモ' in row['text'] or re.match(r'^\d+\s*番',normalize(row['text'])):break
                instruction.append(row)
        prefix=prefix[len(instruction):]
        current=rich(prefix);questions={}
        for qi,question in enumerate(section['questions']):
            qid=question['questionId'];number=int(question['originalNumber']);images=[]
            if number in anchors:
                begin,offset=anchors[number];finish=anchors.get(expected[qi+1],(len(rows),0))[0] if qi+1<len(expected) else len(rows)
                block=rows[begin:finish]
                block=[part(block[0],offset),*block[1:]]
                parsed=parse_options(block)
                if parsed:
                    stem,choices,trailing=parsed
                else:
                    stem=rich([block[0]]) or [{'text':f'{number}番'}]
                    choices={str(i):[{'text':f'Phương án {i}'}] for i in range(1,4 if n in (16,17) else 5)}
                    trailing=[]
                    if n<13:failures.append(f'{exam}/{qid} missing four choices')
                top=rows[begin]['y']
                firstpage=rows[begin]['page'];lastpage=rows[finish]['page'] if finish<len(rows) else end
                for page in range(firstpage,lastpage+1):
                    for image in doc[page-1].get_image_info():
                        box=pymupdf.Rect(image['bbox'])
                        bottom=rows[finish]['y']-20 if finish<len(rows) and rows[finish]['page']==page else doc[page-1].rect.height-35
                        if (page>firstpage or box.y0>top-5) and box.y1<bottom+5 and box.width>35 and box.height>35:
                            images.append(illustration(doc,root,exam,qid,page,box,len(images)+1))
                passage=current if 8<=n<=11 else []
                questions[qid]={'stem':stem or [{'text':f'{number}番' if n>=13 else f'（{number}）に入るものを選んでください。'}], 'choices':choices,'passage':passage,'images':images}
                if trailing:current=rich(trailing)
            else:
                questions[qid]={'stem':[{'text':f'{number}番'}], 'choices':{str(i):[{'text':f'Phương án {i}'}] for i in range(1,4 if n==17 else 5)},'passage':[],'images':[]}
        if n==12:
            # Original informational tables/posters stay illustrations, not flattened column text.
            last_question_page=max(rows[i]['page'] for i,_ in anchors.values())
            materials=[]
            for page in range(last_question_page+1,end+1):
                materialrows=allrows[page]
                rect=pymupdf.Rect(50,min(c['bbox'][1] for r in materialrows for c in r['chars'])-8,doc[page-1].rect.width-35,max(r['y'] for r in materialrows)+8)
                materials.append(illustration(doc,root,exam,sid+'-table',page,rect,len(materials)+1))
            for q in questions.values():q['images']=materials
        sections[sid]={'instructions':plain(rich(instruction)), 'questions':questions}
    return {'sections':sections},failures

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--sources-root',type=Path,required=True);args=parser.parse_args()
    root=Path(__file__).resolve().parents[1]
    out=root.parent/'.tmp/native-exams';out.mkdir(exist_ok=True)
    native={'formatVersion':1,'exams':{}};failures=[]
    for exam,(name,_,_,_) in CONFIG['SOURCES'].items():
        file=next(p for p in args.sources_root.rglob('*.pdf') if p.name==name);doc=pymupdf.open(file)
        allrows={i+1:page_rows(page,i+1) for i,page in enumerate(doc)}
        dump=[]
        for n,(start,end) in enumerate(CONFIG['RANGES'][exam],1):
            problem=n if n<=5 else n-5 if n<=12 else n-12
            rows=group_rows(doc,allrows,start,end,problem)
            dump.append(f'\n=== s{n:02} ===')
            for r in rows:dump.append(f"p{r['page']} y{r['y']:.1f} x{r['x']:.1f} {r['text']}")
        (out/f'{exam}-rows.txt').write_text('\n'.join(dump),encoding='utf8')
        (out/f'{exam}-rows.json').write_text(json.dumps(allrows,ensure_ascii=False),encoding='utf8')
        extracted,errors=extract_exam(root,exam,doc,allrows);extracted['sourceSha256']=hashlib.sha256(file.read_bytes()).hexdigest();native['exams'][exam]=extracted;failures.extend(errors)
        print(exam, len(doc), 'pages extracted')
    if failures:raise SystemExit('\n'.join(failures))
    (root/'src/data/exams/native-content.json').write_text(json.dumps(native,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    audit=[]
    for exam,data in native['exams'].items():
        for sid,section in data['sections'].items():
            audit.append(f'\n=== {exam} {sid} ===\n{section["instructions"]}')
            for qid,q in section['questions'].items():
                audit.append(f'{qid}: {plain(q["stem"])}')
                for key,choice in q['choices'].items():audit.append(f'  {key}: {plain(choice)}')
                audit.append(f'  passage={len(plain(q["passage"]))} chars, images={len(q["images"])}')
    (out/'audit.txt').write_text('\n'.join(audit),encoding='utf8')
    if failures:raise SystemExit('\n'.join(failures))
    print('All expected anchors and text choices extracted.')

if __name__=='__main__':main()
