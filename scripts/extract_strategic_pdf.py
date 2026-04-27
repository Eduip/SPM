#!/Users/edu/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3
import json
import re
import sys
from pathlib import Path

from pypdf import PdfReader


def normalize_spaces(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def is_heading(line: str) -> bool:
    cleaned = line.strip()
    if len(cleaned) < 4 or len(cleaned) > 120:
      return False
    if re.match(r"^\d+(\.\d+)*\s+.+", cleaned):
      return True
    if cleaned.isupper() and len(cleaned.split()) <= 14:
      return True
    if cleaned.endswith(":") and len(cleaned.split()) <= 12:
      return True
    if cleaned.startswith(("CAPITULO", "CAPÍTULO", "EJE", "LINEA", "LÍNEA", "TEMA", "DIMENSION", "DIMENSIÓN")):
      return True
    return False


def extract_keywords(title: str, content: str) -> list[str]:
    words = re.findall(r"[A-Za-zÁÉÍÓÚÑáéíóúñ]{4,}", f"{title} {content}")
    seen = []
    for word in words:
        normalized = word.lower()
        if normalized not in seen:
            seen.append(normalized)
        if len(seen) >= 12:
            break
    return seen


def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "usage: extract_strategic_pdf.py <pdf_path>"}))
        sys.exit(1)

    pdf_path = Path(sys.argv[1])
    if not pdf_path.exists():
        print(json.dumps({"error": "file_not_found"}))
        sys.exit(1)

    reader = PdfReader(str(pdf_path))
    sections = []
    current = None

    for page_index, page in enumerate(reader.pages, start=1):
        raw_text = page.extract_text() or ""
        lines = [normalize_spaces(line) for line in raw_text.splitlines()]
        lines = [line for line in lines if line]

        for line in lines:
            if is_heading(line):
                if current and current["content"].strip():
                    sections.append(current)
                current = {
                    "id": f"chunk-{len(sections) + 1}",
                    "title": line,
                    "content": "",
                    "pageStart": page_index,
                    "pageEnd": page_index,
                }
                continue

            if current is None:
                current = {
                    "id": "chunk-1",
                    "title": f"Sección inicial página {page_index}",
                    "content": "",
                    "pageStart": page_index,
                    "pageEnd": page_index,
                }

            current["content"] = normalize_spaces(f'{current["content"]} {line}')
            current["pageEnd"] = page_index

    if current and current["content"].strip():
        sections.append(current)

    for index, section in enumerate(sections, start=1):
        section["id"] = f"chunk-{index}"
        section["keywords"] = extract_keywords(section["title"], section["content"])

    print(
        json.dumps(
            {
                "pageCount": len(reader.pages),
                "chunks": sections,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
