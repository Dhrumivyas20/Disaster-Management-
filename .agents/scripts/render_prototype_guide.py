from pathlib import Path
import fitz

source = Path("attached_assets/IIT_SIH'26_Prototype_191_1788203871111.pdf")
output = Path(".agents/outputs/prototype_guide")
output.mkdir(parents=True, exist_ok=True)

doc = fitz.open(source)
print(f"pages={doc.page_count}")
for index, page in enumerate(doc):
    pixmap = page.get_pixmap(matrix=fitz.Matrix(1.25, 1.25), alpha=False)
    destination = output / f"page-{index + 1:02d}.png"
    pixmap.save(destination)
    print(destination)