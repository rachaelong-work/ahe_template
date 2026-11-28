/**
 * DOCX Export
 * Converts report HTML into an editable Word document.
 * Charts are converted to high-resolution PNG images.
 */

const D = () => window.docx;


/* =========================================================
   1. CREATE A WORD PARAGRAPH
========================================================= */

function para(text, style) {
  const { Paragraph, TextRun } = D();

  return new Paragraph({
    style,
    children: [
      new TextRun({
        text: String(text ?? "").replace(/\s+/g, " ").trim()
      })
    ]
  });
}


/* =========================================================
   2. CONVERT SVG CHARTS TO PNG
========================================================= */

async function svgPng(svg) {
  const xml = new XMLSerializer().serializeToString(svg);

  const blob = new Blob([xml], {
    type: "image/svg+xml;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);

  try {
    const img = new Image();

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    const canvas = document.createElement("canvas");

    const originalWidth = img.naturalWidth || img.width || 800;
    const originalHeight = img.naturalHeight || img.height || 400;

    canvas.width = 1300;
    canvas.height = Math.round(
      1300 * originalHeight / originalWidth
    );

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Unable to create chart canvas.");
    }

    // White background for Word compatibility
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(
      img,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return canvas
      .toDataURL("image/png")
      .split(",")[1];

  } finally {
    URL.revokeObjectURL(url);
  }
}


/* =========================================================
   3. CONVERT HTML TABLE TO WORD TABLE
========================================================= */

function tableToDocx(table) {
  const {
    Table,
    TableRow,
    TableCell,
    Paragraph,
    TextRun,
    WidthType
  } = D();

  const rows = Array.from(table.rows).map(
    (row, rowIndex) => {

      const cellWidth =
        100 / Math.max(row.cells.length, 1);

      const cells = Array.from(row.cells).map(
        cell => {

          return new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: cell.innerText.trim(),
                    bold: rowIndex === 0
                  })
                ]
              })
            ],

            width: {
              size: cellWidth,
              type: WidthType.PERCENTAGE
            }
          });
        }
      );

      return new TableRow({
        children: cells
      });
    }
  );

  return new Table({
    rows,

    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    }
  });
}


/* =========================================================
   4. CONVERT HTML ELEMENTS INTO WORD CONTENT
========================================================= */

async function nodeToBlocks(node, blocks) {
  const {
    Paragraph,
    TextRun,
    HeadingLevel,
    ImageRun
  } = D();

  // Ignore text nodes
  if (node.nodeType !== 1) {
    return;
  }

  const tag = node.tagName.toLowerCase();


  /* ---------- HEADINGS ---------- */

  const headingLevels = {
    h1: HeadingLevel.HEADING_1,
    h2: HeadingLevel.HEADING_2,
    h3: HeadingLevel.HEADING_3,
    h4: HeadingLevel.HEADING_4
  };

  if (headingLevels[tag]) {
    blocks.push(
      new Paragraph({
        heading: headingLevels[tag],

        children: [
          new TextRun({
            text: node.innerText.trim(),
            bold: true
          })
        ]
      })
    );

    return;
  }


  /* ---------- SVG CHARTS ---------- */

  if (tag === "svg") {
    try {
      const data = await svgPng(node);

      const bytes = Uint8Array.from(
        atob(data),
        character => character.charCodeAt(0)
      );

      const viewBox = node.viewBox?.baseVal;

      const aspectRatio =
        viewBox && viewBox.width > 0
          ? viewBox.height / viewBox.width
          : 0.5;

      const imageHeight = Math.min(
        280,
        520 * aspectRatio
      );

      blocks.push(
        new Paragraph({
          alignment: "center",

          children: [
            new ImageRun({
              data: bytes,

              transformation: {
                width: 520,
                height: imageHeight
              }
            })
          ]
        })
      );

    } catch (error) {
      console.error(
        "Unable to embed chart in DOCX:",
        error
      );

      blocks.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "[Chart could not be embedded in this Word export]",
              italics: true
            })
          ]
        })
      );
    }

    return;
  }


  /* ---------- TABLES ---------- */

  if (tag === "table") {
    blocks.push(tableToDocx(node));
    return;
  }


  /* ---------- REPORT SECTIONS ---------- */

  if (
    tag === "section" &&
    node.classList.contains("reportsection")
  ) {
    const sectionTitle =
      node.querySelector("h3")?.innerText ||
      "Report section";

    blocks.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,

        children: [
          new TextRun({
            text: sectionTitle.trim(),
            bold: true
          })
        ]
      })
    );

    for (const child of Array.from(node.children)) {
      if (child.tagName.toLowerCase() !== "h3") {
        await nodeToBlocks(child, blocks);
      }
    }

    return;
  }


  /* ---------- PARAGRAPHS AND LIST ITEMS ---------- */

  if (
    tag === "p" ||
    tag === "li" ||
    tag === "div" ||
    tag === "span"
  ) {
    const text = node.innerText?.trim();

    if (
      text &&
      !node.querySelector("svg, table")
    ) {
      blocks.push(
        new Paragraph({
          bullet:
            tag === "li"
              ? { level: 0 }
              : undefined,

          children: [
            new TextRun({
              text
            })
          ]
        })
      );

      return;
    }
  }


  /* ---------- PROCESS CHILD ELEMENTS ---------- */

  for (const child of Array.from(node.children)) {
    await nodeToBlocks(child, blocks);
  }
}


/* =========================================================
   5. CREATE DOCX BLOB
========================================================= */

export async function createDocxBlob(reportNodes) {
  if (!D()) {
    throw new Error(
      "Word export library did not load. Check your internet connection and reload."
    );
  }

  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel
  } = D();

  const blocks = [];

  for (let i = 0; i < reportNodes.length; i++) {
    const report = reportNodes[i];

    // Start each agency report on a new page
    if (i > 0) {
      const agencyName =
        report.querySelector("#outCompany")?.innerText ||
        `Agency ${i + 1}`;

      blocks.push(
        new Paragraph({
          pageBreakBefore: true,
          heading: HeadingLevel.HEADING_1,

          children: [
            new TextRun({
              text: agencyName.trim(),
              bold: true
            })
          ]
        })
      );
    }

    await nodeToBlocks(report, blocks);
  }

  const doc = new Document({
    creator: "AHE Corporate Report Generator",

    title:
      "AHE Corporate Health & Fitness Report",

    sections: [
      {
        children: blocks
      }
    ]
  });

  return await Packer.toBlob(doc);
}


/* =========================================================
   6. DOWNLOAD WORD DOCUMENT
========================================================= */

export async function exportReportsToDocx(
  reportNodes,
  filename
) {
  const blob = await createDocxBlob(reportNodes);

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();
  link.remove();

  // Release the temporary download URL
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1500);
}

