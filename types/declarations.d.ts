declare module 'pdf-parse' {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
    text: string;
  }

  function PDFParse(dataBuffer: Buffer | ArrayBuffer | Uint8Array, options?: any): Promise<PDFData>;
  export default PDFParse;
}

declare module 'pdf-parse/lib/pdf-parse.js' {
  import PDFParse from 'pdf-parse';
  export = PDFParse;
}
