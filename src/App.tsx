import React, { useState } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { PDFDocument, StandardFonts } from 'pdf-lib';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

async function modifyPdf(url) {
    console.log('modifyPdf');
    console.log('Fetching the PDF from:', url);
    const existingPdfBytes = await fetch(url).then((res) => {
        console.log('Fetched the PDF successfully');
        return res.arrayBuffer();
    });

    console.log('Loading the fetched PDF...');
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    console.log('Loaded the PDF');

    console.log('Embedding the Helvetica font...');
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    console.log('Embedded the Helvetica font');

    console.log('Getting the pages of the PDF...');
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    console.log('Got the first page of the PDF');

    console.log('Getting the size of the first page...');
    const { width, height } = firstPage.getSize();
    console.log(`Size of the first page - Width: ${width}, Height: ${height}`);

    // IMAGE

    console.log('Fetching the image...');
    const imageUrl = '/test.jpg';
    const imageBytes = await fetch(imageUrl).then((res) => {
        console.log('Fetched the image successfully');
        return res.arrayBuffer();
    });

    console.log('Embedding the image into the PDF...');
    const image = await pdfDoc.embedJpg(imageBytes); // Use embedPng() for PNG images
    console.log('Embedded the image');

    console.log('Drawing the image onto the first page...');

    // Fields
    // Get the form contained within the PDF
    const form = pdfDoc.getForm();
    console.log('form', form);

    // Write to Fields?

    try {
        form.getTextField('Dedication Message ').setText('Hello this is my dedication message!');
    } catch (error) {
        console.log('error', error);
    }

    try {
        form.getTextField('Photo 1').setImage(image);
    } catch (error) {
        console.log('error', error);
    }

    // Image overlay for testing
    if (url === '/interactive.pdf') {
        const originalPageSize = pdfDoc.getPages()[2].getSize();
        console.log('originalPageSize', originalPageSize);

        const newPage2 = pdfDoc.insertPage(3, [originalPageSize.width, originalPageSize.height]);
        const newPage = pdfDoc.insertPage(4, [originalPageSize.width, originalPageSize.height]);

        // Stuff
        const textField = form.getTextField('Photo 1');
        const widgetAnnot = textField.acroField.getWidgets()[0];
        const rectangle = widgetAnnot.getRectangle();
        const { x, y, width, height } = rectangle;

        // Draw the image first on the new page
        newPage.drawImage(image, {
            // x: 0,
            // y: 0,
            // width: newPage.getWidth(),
            // height: newPage.getHeight(),
            x: x,
            y: y,
            width: width,
            height: height,
        });

        newPage2.drawImage(image, {
            // x: 0,
            // y: 0,
            // width: newPage.getWidth(),
            // height: newPage.getHeight(),
            x: x,
            y: y,
            width: width,
            height: height,
        });

        // Draw the original page contents on top of the image.
        //  const [originalPage] = pdfDoc.getPages();
        //  newPage.drawPage(originalPage);
        const [embeddedPage] = await pdfDoc.embedPdf(pdfDoc, [2]);
        newPage.drawPage(embeddedPage, {
            // x: 250,
            // y: 200,
            // xScale: 0.5,
            // yScale: 0.5,
            // opacity: 0.75,
        });

        // Move the new page after the other
        // pdfDoc.movePage(3, 2);
    }

    if (url=== '/card.pdf') {
        form.getTextField('Photo 2').setImage(image);
    }

    // Download the PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sample.pdf';
    link.click();

    // View the PDF in the browser using an iframe
    // const iframe = document.createElement('iframe');
    // iframe.style.width = '100%';
    // iframe.style.height = '500px'; // You can set your desired height
    // iframe.src = link.href;
    // document.body.appendChild(iframe);
}

async function getInfo(url) {
    console.log('Get PDF Info');

    const existingPdfBytes = await fetch(url).then((res) => {
        return res.arrayBuffer();
    });
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Fields
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    console.log('fields', fields);

    const content = [];

    fields.forEach((field) => {
        const fieldName = field.getName();
        const widgets = field.acroField.getWidgets();

        let obj = {};

        if (widgets.length > 0) {
            const firstWidget = widgets[0];
            const rectangle = firstWidget.getRectangle();
            const { x, y, width, height } = rectangle;

            obj['name'] = fieldName;

            obj['position'] = {
                x: x,
                y: y,
            };

            obj['dimensions'] = {
                width: width,
                height: height,
            };

            content.push(obj);
        }
    });

    console.log('content', content);
}

const App = () => {
    const [pdfUrl, setPdfUrl] = useState('/interactive.pdf');

    return (
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.js">
            <button onClick={() => setPdfUrl('/interactive.pdf')}>Book</button>
            <button onClick={() => setPdfUrl('/cover.pdf')}>Cover</button>
            <button onClick={() => setPdfUrl('/card.pdf')}>Card</button>
            <button onClick={() => modifyPdf(pdfUrl)}>PDFLIB Test</button>
            <button onClick={() => getInfo(pdfUrl)}>Get PDF Info</button>

            <div
                style={{
                    height: '800px',
                    width: '800px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    padding: '0',
                    overflow: 'hidden', // Prevent scrolling
                    // backgroundColor: 'red',
                    border: '1px solid black',
                }}
            >
                <Viewer
                    // pageLayout={pageLayout}
                    defaultScale={0.5}
                    // fileUrl="/pdf-open-parameters.pdf"
                    fileUrl={pdfUrl}
                    initialPage={2}
                    // plugins={[defaultLayoutPluginInstance, pagePluginInstance]}
                    // currentPage={pageNumber - 1} // Subtract 1 because page number starts from 0
                />
            </div>
            {/* <div
                style={{
                    height: '500px',
                    width: '400px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    overflow: 'hidden',  // Prevent scrolling
                    // backgroundColor: 'red',
                    border: '1px solid black'
                }}
            >
                <Viewer 
                defaultScale={0.5}
                    // fileUrl="/pdf-open-parameters.pdf" 
                    fileUrl="/sample.pdf"
                    initialPage={5}
                    // plugins={[defaultLayoutPluginInstance, pagePluginInstance]}
                    // currentPage={pageNumber - 1} // Subtract 1 because page number starts from 0
                />
            </div> */}
        </Worker>
    );
};

export default App;
