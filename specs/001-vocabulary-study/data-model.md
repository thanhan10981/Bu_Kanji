# Data Model

- Folder: id UUID, ownerId UUID FK users CASCADE, name `1–120 ký tự sau trim`, createdAt,
  updatedAt. Set thuộc đúng một Folder. Tên trùng được phép.
- Set: id UUID, folderId UUID FK CASCADE, name `1–120 ký tự sau trim`, createdAt, updatedAt.
- Card: id UUID, setId UUID FK CASCADE, meaning `1–500 ký tự sau trim`,
  reading `1–200 ký tự hiragana hoặc ー sau NFC và bỏ khoảng trắng`,
  japanese `tối đa 200 ký tự, tùy chọn`, createdAt, updatedAt.
- Response summary: folder setCount/cardCount; set cardCount; stable order createdAt,id ASC.
- Delete confirmation: expectedSetCount, expectedCardCount integers >=0; stale preview →409.
- Study snapshot: cards copied when starting, index, graded answer, wrongCards; no persistence.
  State: answering → graded → next/finished → retry-wrong(new snapshot).
- IME edit state: displayed value, caret, pending nn context, composition guard;
  delete/navigation invalidate context if insertion is not at recorded caret.

Validation dùng chung ngữ nghĩa trên server và client. Mọi query folder/set/card phải gắn
owner; không nhận ownerId/folderId/setId trong body update. UUID không hợp lệ →400,
không tồn tại hoặc không sở hữu →404 cùng thông báo không lộ thông tin.
