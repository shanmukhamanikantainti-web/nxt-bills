import React from 'react';

export interface InvoiceItemLine {
  serialNo: number;
  productName: string;
  hsnSac: string;
  quantity: number;
  rate: number; // in rupees
  cgstRate: number; // e.g. 9 for 9%
  cgstAmount: number; // in rupees
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  total: number; // in rupees
}

export interface InvoicePrintData {
  invoiceNumber: string;
  invoiceDate: string;
  ackNumber?: string;
  ackDate?: string;
  irnNumber?: string;
  paymentMode: string;
  employeeName?: string;
  company: {
    legalName: string;
    tradeName?: string;
    gstin: string;
    pan?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    stateCode?: string;
    postalCode?: string;
    phone?: string;
    email?: string;
    website?: string;
    accentColor?: string;
  };
  customer: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    stateCode?: string;
    gstin?: string;
    phone?: string;
    shippingAddress?: string;
  };
  items: InvoiceItemLine[];
  subtotal: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;
}

// Convert numbers to Indian Rupees in words
export function numberToIndianWords(num: number): string {
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
    'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ',
    'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty ', 'Thirty ', 'Forty ', 'Fifty ', 'Sixty ', 'Seventy ', 'Eighty ', 'Ninety '];

  function convertGroup(n: number): string {
    let output = '';
    if (n > 99) {
      output += a[Math.floor(n / 100)] + 'Hundred ';
      n %= 100;
    }
    if (n > 19) {
      output += b[Math.floor(n / 10)] + a[n % 10];
    } else if (n > 0) {
      output += a[n];
    }
    return output;
  }

  const rounded = Math.round(num);
  if (rounded === 0) return 'Rupees Zero Only';

  let str = '';
  const crore = Math.floor(rounded / 10000000);
  const lakh = Math.floor((rounded % 10000000) / 100000);
  const thousand = Math.floor((rounded % 100000) / 1000);
  const hundred = Math.floor(rounded % 1000);

  if (crore > 0) str += convertGroup(crore) + 'Crore ';
  if (lakh > 0) str += convertGroup(lakh) + 'Lakh ';
  if (thousand > 0) str += convertGroup(thousand) + 'Thousand ';
  if (hundred > 0) str += convertGroup(hundred);

  return 'Rupees ' + str.trim() + ' Only';
}

interface InvoicePrintProps {
  data: InvoicePrintData;
  id?: string;
  className?: string;
}

export const InvoicePrintDocument: React.FC<InvoicePrintProps> = ({
  data,
  id = 'invoice-printable-area',
  className = 'invoice-printable-sheet',
}) => {
  const accent = data.company.accentColor || '#D4121C';

  // Minimum rows for clean A4 proportion matching original invoice template
  const minRows = 10;
  const emptyRowsCount = Math.max(0, minRows - data.items.length);

  return (
    <div
      id={id}
      className={className}
      style={{
        width: '794px',
        minHeight: '1120px',
        boxSizing: 'border-box',
        padding: '20px 24px',
        background: '#FFFFFF',
        color: '#111111',
        fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: '11.5px',
        lineHeight: 1.35,
        margin: '0 auto',
      }}
    >
      {/* 1. Header Bar: GSTIN left, TAX INVOICE center */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px' }}>
        <tbody>
          <tr>
            <td style={{ width: '30%', fontSize: '13px', fontWeight: 600, verticalAlign: 'bottom' }}>
              GSTIN: {data.company.gstin}
            </td>
            <td style={{ width: '40%', textAlign: 'center', verticalAlign: 'bottom' }}>
              <div style={{ fontWeight: 700, fontSize: '24px', letterSpacing: '0.5px', lineHeight: 1 }}>
                TAX INVOICE
              </div>
            </td>
            <td style={{ width: '30%', verticalAlign: 'bottom' }}></td>
          </tr>
        </tbody>
      </table>

      {/* 2. Main Outer Border Box */}
      <div style={{ border: '1px solid #111111', boxSizing: 'border-box' }}>
        
        {/* Section A: Company Legal Name (54%) and Company Tax Info + QR (46%) */}
        <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', borderBottom: '1px solid #111111' }}>
          <tbody>
            <tr>
              {/* Left Cell: Company Title (54%) */}
              <td
                style={{
                  width: '54%',
                  borderRight: '1px solid #111111',
                  verticalAlign: 'middle',
                  padding: '12px 14px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontFamily: "'Fraunces', 'Georgia', 'Times New Roman', serif",
                    fontWeight: 700,
                    fontSize: '26px',
                    lineHeight: 1.15,
                    color: accent,
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    wordBreak: 'break-word',
                  }}
                >
                  {data.company.legalName}
                </div>
              </td>

              {/* Right Cell: Company GST/PAN/State + QR Area (46%) */}
              <td
                style={{
                  width: '46%',
                  verticalAlign: 'top',
                  padding: '10px 12px',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ verticalAlign: 'top', fontSize: '11px', lineHeight: 1.4, fontWeight: 600 }}>
                        <div>GSTIN: {data.company.gstin}</div>
                        {data.company.pan && <div style={{ fontWeight: 500 }}>PAN: {data.company.pan}</div>}
                        {data.company.state && (
                          <div style={{ fontWeight: 500 }}>
                            State: {data.company.state} (Code: {data.company.stateCode || ''})
                          </div>
                        )}
                      </td>
                      <td style={{ verticalAlign: 'top', textAlign: 'right', width: '74px' }}>
                        <div
                          style={{
                            width: '74px',
                            height: '74px',
                            boxSizing: 'border-box',
                            border: '1.5px dashed #8A8F8C',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '9px',
                            color: '#8A8F8C',
                            textAlign: 'center',
                          }}
                        >
                          QR AREA
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section B: To (Customer Details - 54%) and Invoice Metadata + Shipping Address (46%) */}
        <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', borderBottom: '1px solid #111111' }}>
          <tbody>
            <tr>
              {/* Left Cell: Customer Details (54%) */}
              <td
                style={{
                  width: '54%',
                  borderRight: '1px solid #111111',
                  verticalAlign: 'top',
                  padding: '8px 12px',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '26px', verticalAlign: 'top', fontWeight: 600 }}>To</td>
                      <td style={{ verticalAlign: 'top', lineHeight: 1.45 }}>
                        <div style={{ fontWeight: 700, fontSize: '12px' }}>{data.customer.name}</div>
                        {data.customer.address && <div>{data.customer.address}</div>}
                        {data.customer.city && (
                          <div>
                            {data.customer.city}
                            {data.customer.state ? `, ${data.customer.state}` : ''}
                          </div>
                        )}
                        {data.customer.gstin && (
                          <div style={{ fontWeight: 600, marginTop: '2px' }}>GSTIN: {data.customer.gstin}</div>
                        )}
                        {data.customer.stateCode && <div>State Code: {data.customer.stateCode}</div>}
                        {data.customer.phone && <div>Phone: {data.customer.phone}</div>}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>

              {/* Right Cell: Invoice Meta & Shipping (46%) */}
              <td
                style={{
                  width: '46%',
                  verticalAlign: 'top',
                  padding: 0,
                }}
              >
                {/* Meta details sub-table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '1px solid #111111', fontSize: '11px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '6px 10px 3px', width: '50%' }}>
                        <strong>Invoice No.:</strong> {data.invoiceNumber}
                      </td>
                      <td style={{ padding: '6px 10px 3px', width: '50%', textAlign: 'right' }}>
                        <strong>Date :</strong> {data.invoiceDate}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 10px 3px', width: '50%' }}>
                        <strong>Ack No.:</strong> {data.ackNumber || '-'}
                      </td>
                      <td style={{ padding: '2px 10px 3px', width: '50%', textAlign: 'right' }}>
                        <strong>Ack Date:</strong> {data.ackDate || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} style={{ padding: '2px 10px 6px', wordBreak: 'break-all' }}>
                        <strong>IRN No:</strong> {data.irnNumber || '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Shipping address block */}
                <div style={{ padding: '6px 10px 8px' }}>
                  <div style={{ fontSize: '10.5px', color: '#444947', fontWeight: 600 }}>Shipping Address</div>
                  <div style={{ marginTop: '2px', fontSize: '11px', lineHeight: 1.35 }}>
                    {data.customer.shippingAddress || data.customer.address || 'Same as billing address'}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section C: Itemised Products Table with Rigid Colgroup */}
        <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontVariantNumeric: 'tabular-nums' }}>
          <colgroup>
            <col style={{ width: '5%' }} />    {/* S.No */}
            <col style={{ width: '31%' }} />   {/* PRODUCT NAME */}
            <col style={{ width: '12%' }} />   {/* HSN/SAC */}
            <col style={{ width: '6%' }} />    {/* QTY */}
            <col style={{ width: '10%' }} />   {/* RATE */}
            <col style={{ width: '8%' }} />    {/* CGST */}
            <col style={{ width: '8%' }} />    {/* SGST */}
            <col style={{ width: '8%' }} />    {/* IGST */}
            <col style={{ width: '12%' }} />   {/* TOTAL */}
          </colgroup>
          <thead>
            <tr style={{ background: '#F0F0F0', fontSize: '11px', fontWeight: 700 }}>
              <th style={{ padding: '6px 2px', textAlign: 'center', borderRight: '1px solid #111111', borderBottom: '1px solid #111111' }}>
                S.No
              </th>
              <th style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #111111', borderBottom: '1px solid #111111' }}>
                PRODUCT NAME
              </th>
              <th style={{ padding: '6px 2px', textAlign: 'center', borderRight: '1px solid #111111', borderBottom: '1px solid #111111' }}>
                HSN/SAC
              </th>
              <th style={{ padding: '6px 2px', textAlign: 'center', borderRight: '1px solid #111111', borderBottom: '1px solid #111111' }}>
                QTY
              </th>
              <th style={{ padding: '6px 2px', textAlign: 'center', borderRight: '1px solid #111111', borderBottom: '1px solid #111111' }}>
                RATE
              </th>
              <th style={{ padding: '6px 2px', textAlign: 'center', borderRight: '1px solid #111111', borderBottom: '1px solid #111111' }}>
                CGST
              </th>
              <th style={{ padding: '6px 2px', textAlign: 'center', borderRight: '1px solid #111111', borderBottom: '1px solid #111111' }}>
                SGST
              </th>
              <th style={{ padding: '6px 2px', textAlign: 'center', borderRight: '1px solid #111111', borderBottom: '1px solid #111111' }}>
                IGST
              </th>
              <th style={{ padding: '6px 4px', textAlign: 'center', borderBottom: '1px solid #111111' }}>
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((it, idx) => (
              <tr key={idx} style={{ fontSize: '11px', height: '22px' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #111111', padding: '3px 2px' }}>{it.serialNo}</td>
                <td style={{ borderRight: '1px solid #111111', padding: '3px 6px', fontWeight: 500, wordBreak: 'break-word' }}>
                  {it.productName}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #111111', padding: '3px 2px' }}>{it.hsnSac || '-'}</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #111111', padding: '3px 2px' }}>{it.quantity}</td>
                <td style={{ textAlign: 'right', borderRight: '1px solid #111111', padding: '3px 4px' }}>{it.rate.toFixed(2)}</td>
                <td style={{ textAlign: 'right', borderRight: '1px solid #111111', padding: '3px 4px' }}>
                  {it.cgstAmount > 0 ? it.cgstAmount.toFixed(2) : '-'}
                </td>
                <td style={{ textAlign: 'right', borderRight: '1px solid #111111', padding: '3px 4px' }}>
                  {it.sgstAmount > 0 ? it.sgstAmount.toFixed(2) : '-'}
                </td>
                <td style={{ textAlign: 'right', borderRight: '1px solid #111111', padding: '3px 4px' }}>
                  {it.igstAmount > 0 ? it.igstAmount.toFixed(2) : '-'}
                </td>
                <td style={{ textAlign: 'right', padding: '3px 6px', fontWeight: 600 }}>{it.total.toFixed(2)}</td>
              </tr>
            ))}

            {/* Empty filler rows ensuring clean document height */}
            {Array.from({ length: emptyRowsCount }).map((_, idx) => (
              <tr key={`empty-${idx}`} style={{ height: '22px' }}>
                <td style={{ borderRight: '1px solid #111111', padding: '3px 2px' }}>&nbsp;</td>
                <td style={{ borderRight: '1px solid #111111', padding: '3px 6px' }}>&nbsp;</td>
                <td style={{ borderRight: '1px solid #111111', padding: '3px 2px' }}>&nbsp;</td>
                <td style={{ borderRight: '1px solid #111111', padding: '3px 2px' }}>&nbsp;</td>
                <td style={{ borderRight: '1px solid #111111', padding: '3px 4px' }}>&nbsp;</td>
                <td style={{ borderRight: '1px solid #111111', padding: '3px 4px' }}>&nbsp;</td>
                <td style={{ borderRight: '1px solid #111111', padding: '3px 4px' }}>&nbsp;</td>
                <td style={{ borderRight: '1px solid #111111', padding: '3px 4px' }}>&nbsp;</td>
                <td style={{ padding: '3px 6px' }}>&nbsp;</td>
              </tr>
            ))}

            {/* Subtotal / Round Off & Total Rows */}
            <tr style={{ borderTop: '1px solid #111111' }}>
              <td
                colSpan={4}
                rowSpan={2}
                style={{
                  verticalAlign: 'bottom',
                  textAlign: 'center',
                  padding: '4px 6px 4px',
                  borderRight: '1px solid #111111',
                  fontSize: '11px',
                }}
              >
                <div style={{ marginBottom: '2px', fontWeight: 600 }}>Receiver's Signature</div>
                <div style={{ fontSize: '9.5px', color: '#555' }}>
                  Received the above mentioned item in good order &amp; condition
                </div>
              </td>
              <td
                style={{
                  borderRight: '1px solid #111111',
                  borderTop: '1px solid #111111',
                  padding: '3px 4px',
                  fontSize: '10px',
                  fontWeight: 700,
                }}
              >
                Round Off
              </td>
              <td style={{ borderRight: '1px solid #111111', borderTop: '1px solid #111111' }}></td>
              <td style={{ borderRight: '1px solid #111111', borderTop: '1px solid #111111' }}></td>
              <td style={{ borderRight: '1px solid #111111', borderTop: '1px solid #111111' }}></td>
              <td
                style={{
                  borderTop: '1px solid #111111',
                  padding: '3px 6px',
                  textAlign: 'right',
                  fontWeight: 700,
                }}
              >
                {data.roundOff >= 0 ? `+${data.roundOff.toFixed(2)}` : data.roundOff.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  borderRight: '1px solid #111111',
                  borderTop: '1px solid #111111',
                  padding: '3px 4px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                Total
              </td>
              <td style={{ borderRight: '1px solid #111111', borderTop: '1px solid #111111', padding: '3px 4px', textAlign: 'right', fontWeight: 600 }}>
                {data.items.reduce((acc, x) => acc + x.cgstAmount, 0).toFixed(2)}
              </td>
              <td style={{ borderRight: '1px solid #111111', borderTop: '1px solid #111111', padding: '3px 4px', textAlign: 'right', fontWeight: 600 }}>
                {data.items.reduce((acc, x) => acc + x.sgstAmount, 0).toFixed(2)}
              </td>
              <td style={{ borderRight: '1px solid #111111', borderTop: '1px solid #111111', padding: '3px 4px', textAlign: 'right', fontWeight: 600 }}>
                {data.items.reduce((acc, x) => acc + x.igstAmount, 0).toFixed(2)}
              </td>
              <td
                style={{
                  borderTop: '1px solid #111111',
                  padding: '3px 6px',
                  textAlign: 'right',
                  fontSize: '12px',
                  fontWeight: 800,
                }}
              >
                ₹ {data.grandTotal.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section D: Counts & Amounts Info */}
        <div style={{ borderTop: '1px solid #111111', padding: '5px 10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%' }}>
                  <strong>Number of items:</strong> {data.items.length}
                </td>
                <td style={{ width: '50%', textAlign: 'right' }}>
                  <strong>Employee Name:</strong> {data.employeeName || 'Staff'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ padding: '3px 10px', borderTop: '1px solid #EEEEEE' }}>
          <strong>Amount In Words:</strong> {data.amountInWords}
        </div>
        <div style={{ padding: '3px 10px 8px', borderBottom: '1px solid #111111' }}>
          <strong>Payment Mode:</strong> {data.paymentMode}
        </div>

        {/* Section E: Terms and Signatures */}
        <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', padding: '8px 10px' }}>
          <tbody>
            <tr>
              <td style={{ width: '58%', verticalAlign: 'bottom', padding: '8px 10px', fontSize: '9.5px', lineHeight: 1.35 }}>
                <strong>Note:</strong>
                <br />
                Goods once sold will not be taken back or exchanged under any circumstances.
                <br />
                The article(s) sold is/are guaranteed by respective manufacturers only.
                <br />
                Dispute, if any, is subject to {data.company.city || 'Jurisdiction'} Jurisdiction only.
              </td>
              <td style={{ width: '42%', verticalAlign: 'bottom', padding: '8px 10px', textAlign: 'right' }}>
                <div style={{ fontSize: '12px', marginBottom: '32px' }}>
                  For <span style={{ fontWeight: 700, color: accent }}>{data.company.legalName}</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <tbody>
                    <tr>
                      <td style={{ textAlign: 'left' }}>Customer Signature.</td>
                      <td style={{ textAlign: 'right' }}>Authorised signatory.</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section F: Registered Office & Contact Footer */}
        <div style={{ borderTop: '1px solid #111111', padding: '6px 10px', fontSize: '10px', lineHeight: 1.45 }}>
          <div>
            <strong>Regd. Office:</strong>{' '}
            {[data.company.addressLine1, data.company.addressLine2, data.company.city, data.company.state, data.company.postalCode]
              .filter(Boolean)
              .join(', ') || 'Registered Office Address'}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2px' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%' }}>
                  <strong>Email:</strong> {data.company.email || '-'}
                </td>
                <td style={{ width: '50%', textAlign: 'right' }}>
                  <strong>Website:</strong> {data.company.website || '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};
