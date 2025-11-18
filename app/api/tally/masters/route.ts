// app/api/tally/masters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import xml2js from 'xml2js';

function detectEncoding(buffer: Buffer): string {
  if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
    return 'utf16le';
  }
  if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
    return 'utf16be';
  }
  if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    return 'utf8';
  }
  
  let nullByteCount = 0;
  for (let i = 0; i < Math.min(buffer.length, 1000); i += 2) {
    if (buffer[i + 1] === 0x00 && buffer[i] !== 0x00) {
      nullByteCount++;
    }
  }
  if (nullByteCount > 100) {
    return 'utf16le';
  }
  
  return 'utf8';
}

function fixUnEncodedCharacters(xmlContent: string): string {
  const tagsToWrap = ['NARRATION', 'NAME', 'ADDRESS', 'LEDGERNAME', 'PARENT', 'MAILINGNAME', 'STATENAME', 'COUNTRYNAME'];
  
  tagsToWrap.forEach(tag => {
    const regex = new RegExp(`<${tag}>([^<]*?)</${tag}>`, 'gi');
    xmlContent = xmlContent.replace(regex, (match, content) => {
      if (content.includes('CDATA') || !content.trim()) {
        return match;
      }
      if (content.includes('<') || content.includes('>') || content.includes('&')) {
        return `<${tag}><![CDATA[${content}]]></${tag}>`;
      }
      return match;
    });
  });
  
  return xmlContent;
}

function cleanXmlContent(xmlContent: string): string {
  let cleaned = xmlContent.trim();
  
  // Remove any characters before the first <
  const firstTagIndex = cleaned.indexOf('<');
  if (firstTagIndex > 0) {
    cleaned = cleaned.substring(firstTagIndex);
  }
  
  // Remove any characters after the last >
  const lastTagIndex = cleaned.lastIndexOf('>');
  if (lastTagIndex < cleaned.length - 1) {
    cleaned = cleaned.substring(0, lastTagIndex + 1);
  }
  
  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Starting XML Processing ===');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    console.log('File name:', file.name);
    console.log('File size:', file.size);

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Detect encoding
    const encoding = detectEncoding(buffer);
    console.log('Detected encoding:', encoding);
    
  let xmlContent: string;

if (encoding === 'utf16le') {
  const startIndex = (buffer[0] === 0xFF && buffer[1] === 0xFE) ? 2 : 0;
  xmlContent = buffer.toString('utf16le', startIndex);
} else if (encoding === 'utf16be') {
  const startIndex = (buffer[0] === 0xFE && buffer[1] === 0xFF) ? 2 : 0;
  const beBuffer = Buffer.from(buffer.slice(startIndex));
  for (let i = 0; i < beBuffer.length - 1; i += 2) {
    const temp = beBuffer[i];
    beBuffer[i] = beBuffer[i + 1];
    beBuffer[i + 1] = temp;
  }
  xmlContent = beBuffer.toString('utf16le');
} else {
  const startIndex = (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) ? 3 : 0;
  xmlContent = buffer.toString('utf8', startIndex);
}
    
    console.log('Original content sample (first 200 chars):', xmlContent.substring(0, 200));
    
    // Clean XML content
    xmlContent = cleanXmlContent(xmlContent);
    xmlContent = fixUnEncodedCharacters(xmlContent);
    
    console.log('Cleaned XML Content Length:', xmlContent.length);
    console.log('First 500 chars:\n', xmlContent.substring(0, 500));
    console.log('Last 500 chars:\n', xmlContent.substring(xmlContent.length - 500));
    
    // Check XML structure
    console.log('\n=== XML Structure Check ===');
    console.log('Has <ENVELOPE>:', /<ENVELOPE>/.test(xmlContent));
    console.log('Has </ENVELOPE>:', /<\/ENVELOPE>/.test(xmlContent));
    console.log('Has <BODY>:', /<BODY>/.test(xmlContent));
    console.log('Has <IMPORTDATA>:', /<IMPORTDATA>/.test(xmlContent));
    
    // Parse XML
    console.log('\n=== Attempting to parse XML ===');
    
    const parserOptions = {
      explicitArray: false,
      mergeAttrs: true,
      trim: true,
      strict: false,
      normalize: true,
      normalizeTags: false,
      ignoreAttrs: false,
      attrkey: '$',
      charkey: '_'
    };
    
    let result = null;
    let parseError = null;
    
    try {
      const parser = new xml2js.Parser(parserOptions);
      result = await parser.parseStringPromise(xmlContent);
      console.log('✅ XML parsing succeeded');
    } catch (err) {
      parseError = err;
      console.log('❌ XML parsing failed:', err instanceof Error ? err.message : String(err));
      
      // Try alternative approach for problematic XML
      console.log('Trying alternative parsing...');
      try {
        // Remove any potential problematic characters
        let cleanXml = xmlContent.replace(/[^\x20-\x7E\r\n\t]/g, '');
        cleanXml = cleanXml.replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, '&amp;');
        
        const parser = new xml2js.Parser(parserOptions);
        result = await parser.parseStringPromise(cleanXml);
        console.log('✅ Alternative parsing succeeded');
      } catch (err2) {
        console.log('❌ Alternative parsing also failed:', err2 instanceof Error ? err2.message : String(err2));
      }
    }
    
    console.log('\n=== Parse Result ===');
    console.log('Result is null?', result === null);
    console.log('Result type:', typeof result);
    
    if (result) {
      console.log('Result keys:', Object.keys(result));
      
      // Extract Tally data structure
      const envelope = result.ENVELOPE;
      if (envelope) {
        console.log('ENVELOPE structure:', Object.keys(envelope));
        
        const body = envelope.BODY;
        if (body) {
          console.log('BODY structure:', Object.keys(body));
          
          const importData = body.IMPORTDATA;
          if (importData) {
            console.log('IMPORTDATA structure:', Object.keys(importData));
            
            const requestData = importData.REQUESTDATA;
            if (requestData) {
              console.log('REQUESTDATA structure:', Object.keys(requestData));
              
              const tallyMessage = requestData.TALLYMESSAGE;
              if (tallyMessage) {
                console.log('TALLYMESSAGE type:', typeof tallyMessage);
                console.log('TALLYMESSAGE is array?', Array.isArray(tallyMessage));
                
                if (Array.isArray(tallyMessage)) {
                  console.log('Number of TALLYMESSAGE entries:', tallyMessage.length);
                  if (tallyMessage.length > 0) {
                    console.log('First TALLYMESSAGE keys:', Object.keys(tallyMessage[0]));
                  }
                }
              }
            }
          }
        }
      }
    }
    
    return NextResponse.json({
      success: !!result,
      data: result,
      debug: {
        encoding,
        resultIsNull: result === null,
        resultType: typeof result,
        resultKeys: result ? Object.keys(result) : [],
        xmlStructure: {
          hasEnvelope: /<ENVELOPE>/.test(xmlContent),
          hasBody: /<BODY>/.test(xmlContent),
          hasImportData: /<IMPORTDATA>/.test(xmlContent),
          contentLength: xmlContent.length
        },
        contentSample: {
          first100: xmlContent.substring(0, 100),
          last100: xmlContent.substring(xmlContent.length - 100)
        }
      },
      meta: {
        fileSize: file.size,
        fileName: file.name,
        contentLength: xmlContent.length,
        encoding
      }
    });
    
  } catch (error) {
    console.error('=== ERROR ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    
    return NextResponse.json(
      { 
        error: 'Failed to process XML file', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : undefined : undefined
      },
      { status: 500 }
    );
  }
}