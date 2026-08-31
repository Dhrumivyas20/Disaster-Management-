from pathlib import Path
import fitz

source = Path("attached_assets/PixelAlchemy_SIH191_1788203034061.pdf")
output = Path(".agents/outputs/pixelalchemy_pdf")
output.mkdir(parents=True, exist_ok=True)

doc = fitz.open(source)
print(f"pages={doc.page_count}")
for index, page in enumerate(doc):
    pixmap = page.get_pixmap(matrix=fitz.Matrix(1.25, 1.25), alpha=False)
    destination = output / f"page-{index + 1:02d}.png"
    pixmap.save(destination)
    print(destination)