import React from 'react';
import { Company, Customer } from '../services/api';

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
}

export const InvoicePrintDocument: React.FC<InvoicePrintProps> = ({ data }) => {
  const accent = data.company.accentColor || '#D4121C';

  // Fill up blank rows if fewer items to preserve reference height exactly
  const minRows = 10;
  const emptyRowsCount = Math.max(0, minRows - data.items.length);

  return (
    <div
      id="invoice-printable-area"
      style={{
        width: '794px',
        minHeight: '1123px',
        boxSizing: 'border-box',
        padding: '22px 24px',
        background: '#FFFFFF',
        color: '#111111',
        fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: '11.5px',
        lineHeight: 1.35,
        display: 'flex',
        flexDirection: 'column',
        margin: '0 auto',
      }}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: '4px' }}>
        <div style={{ fontSize: '14px', width: '260px', fontWeight: 600 }}>
          GSTIN: {data.company.gstin}
        </div>
        <div style={{ fontWeight: 700, fontSize: '26px', letterSpacing: '0.5px', lineHeight: 1 }}>
          TAX INVOICE
        </div>
        <div style={{ width: '260px' }}></div>
      </div>

      {/* Main Border Box */}
      <div style={{ border: '1px solid #111111', display: 'flex', flexDirection: 'column', flex: '1 1 auto' }}>
        {/* Company and QR Block */}
        <div style={{ display: 'flex', borderBottom: '1px solid #111111', minHeight: '124px' }}>
          <div
            style={{
              width: '54%',
              boxSizing: 'border-box',
              borderRight: '1px solid #111111',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px',
            }}
          >
            <div
              style={{
                fontFamily: "'Fraunces', 'Georgia', serif",
                fontWeight: 700,
                fontSize: '28px',
                lineHeight: 1.15,
                color: accent,
                textAlign: 'center',
                textTransform: 'uppercase',
              }}
            >
              {data.company.legalName}
            </div>
          </div>
          <div
            style={{
              flex: '1 1 0',
              minWidth: 0,
              display: 'flex',
              justifyContent: 'space-between',
              gap: '8px',
              padding: '10px 10px 8px 10px',
            }}
          >
            <div style={{ fontSize: '11px', lineHeight: 1.4, fontWeight: 600 }}>
              GSTIN: {data.company.gstin}
              {data.company.pan && <div style={{ fontWeight: 500 }}>PAN: {data.company.pan}</div>}
              {data.company.state && (
                <div style={{ fontWeight: 500 }}>
                  State: {data.company.state} (Code: {data.company.stateCode || ''})
                </div>
              )}
            </div>
            {/* QR Placeholder Box */}
            <div
              style={{
                width: '74px',
                height: '74px',
                flex: 'none',
                boxSizing: 'border-box',
                border: '1.5px dashed #8A8F8C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                color: '#8A8F8C',
                textAlign: 'center',
              }}
            >
              QR AREA
            </div>
          </div>
        </div>

        {/* Customer & Invoice Meta Block */}
        <div style={{ display: 'flex', borderBottom: '1px solid #111111', minHeight: '178px' }}>
          {/* To: Customer Details */}
          <div
            style={{
              width: '54%',
              boxSizing: 'border-box',
              borderRight: '1px solid #111111',
              padding: '8px 10px',
              display: 'flex',
              gap: '10px',
            }}
          >
            <div style={{ flex: 'none', fontWeight: 600 }}>To</div>
            <div style={{ flex: '1 1 auto', lineHeight: 1.45 }}>
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
            </div>
          </div>

          {/* Invoice Meta & Shipping Address */}
          <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                borderBottom: '1px solid #111111',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  <strong>Invoice No.:</strong> {data.invoiceNumber}
                </span>
                <span>
                  <strong>Date :</strong> {data.invoiceDate}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  <strong>Ack No.:</strong> {data.ackNumber || '-'}
                </span>
                <span>
                  <strong>Ack Date:</strong> {data.ackDate || '-'}
                </span>
              </div>
              <div style={{ fontSize: '11px' }}>
                <strong>IRN No:</strong> {data.irnNumber || '-'}
              </div>
            </div>
            <div style={{ padding: '6px 10px 8px', flex: '1 1 auto' }}>
              <div style={{ fontSize: '10.5px', color: '#444947', fontWeight: 600 }}>Shipping Address</div>
              <div style={{ marginTop: '2px', fontSize: '11px', lineHeight: 1.35 }}>
                {data.customer.shippingAddress || data.customer.address || 'Same as billing address'}
              </div>
            </div>
          </div>
        </div>

        {/* Product Table */}
        <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontVariantNumeric: 'tabular-nums' }}>
          <thead>
            <tr style={{ background: '#F0F0F0', fontSize: '11px', fontWeight: 700 }}>
              <th style={{ width: '38px', padding: '7px 2px', textAlign: 'center', borderRight: '1px solid #111111', borderBottom: '1px solid #111111' }}>
                S.No
              </th>
              <th style={{ padding: '7px 6px', textAlign: 'center', borderRight: '1px solid #111111', borderBottom: '1px solid #111111' }}>
                PRODUCT NAME
              </th>
              <th style={{ width: '68px', padding: '7px 2px', textAlign: 'center', borderRight: '1px solid #111111', borderBottom: '1px solid #111111' }}>
                HSN/SAC
              </th>
              <th style={{ width: '45px', padding: '7px 2px', textAlign: 'center', borderRight: '1px solid #111111', borderBottom: '1px solid #111111' }}>
                QTY
              </th>
              <th style={{ width: '65px', padding: '7px 2px', textAlign: 'center', borderRight: '1px solid #111111', borderBottom: '1px solid #111111' }}>
                RATE
              </th>
              <th style={{ width: '55px', padding: '7px 2px', textAlign: 'center', borderRight: '1px solid #111111', borderBottom: '1px solid #111111' }}>
                CGST
              </th>
              <th style={{ width: '55px', padding: '7px 2px', textAlign: 'center', borderRight: '1px solid #111111', borderBottom: '1px solid #111111' }}>
                SGST
              </th>
              <th style={{ width: '55px', padding: '7px 2px', textAlign: 'center', borderRight: '1px solid #111111', borderBottom: '1px solid #111111' }}>
                IGST
              </th>
              <th style={{ width: '80px', padding: '7px 4px', textAlign: 'center', borderBottom: '1px solid #111111' }}>
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((it, idx) => (
              <tr key={idx} style={{ fontSize: '11px', minHeight: '22px' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #111111', padding: '3px 2px' }}>{it.serialNo}</td>
                <td style={{ borderRight: '1px solid #111111', padding: '3px 6px', fontWeight: 500 }}>{it.productName}</td>
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

            {/* Empty filler rows */}
            {Array.from({ length: emptyRowsCount }).map((_, idx) => (
              <tr key={`empty-${idx}`} style={{ height: '24px' }}>
                <td style={{ borderRight: '1px solid #111111' }}></td>
                <td style={{ borderRight: '1px solid #111111' }}></td>
                <td style={{ borderRight: '1px solid #111111' }}></td>
                <td style={{ borderRight: '1px solid #111111' }}></td>
                <td style={{ borderRight: '1px solid #111111' }}></td>
                <td style={{ borderRight: '1px solid #111111' }}></td>
                <td style={{ borderRight: '1px solid #111111' }}></td>
                <td style={{ borderRight: '1px solid #111111' }}></td>
                <td></td>
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

        {/* Counts & Amounts Info */}
        <div style={{ borderTop: '1px solid #111111', padding: '5px 10px', display: 'flex', gap: '40px' }}>
          <span>
            <strong>Number of items:</strong> {data.items.length}
          </span>
          <span>
            <strong>Employee Name:</strong> {data.employeeName || 'Staff'}
          </span>
        </div>
        <div style={{ padding: '4px 10px 4px' }}>
          <strong>Amount In Words:</strong> {data.amountInWords}
        </div>
        <div style={{ padding: '4px 10px 10px' }}>
          <strong>Payment Mode:</strong> {data.paymentMode}
        </div>

        {/* Terms and Signatures */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            padding: '10px 10px 8px',
            flex: '1 1 auto',
          }}
        >
          <div style={{ fontSize: '9.5px', lineHeight: 1.35, maxWidth: '420px' }}>
            <strong>Note:</strong>
            <br />
            Goods once sold will not be taken back or exchanged under any circumstances.
            <br />
            The article(s) sold is/are guaranteed by respective manufacturers only.
            <br />
            Dispute, if any, is subject to {data.company.city || 'Jurisdiction'} Jurisdiction only.
          </div>
          <div style={{ width: '300px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '28px' }}>
            <div style={{ fontSize: '12px' }}>
              For <span style={{ fontWeight: 700, color: accent }}>{data.company.legalName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '11px' }}>
              <span>Customer Signature.</span>
              <span>Authorised signatory.</span>
            </div>
          </div>
        </div>

        {/* Footer: Registered Office & Contacts */}
        <div style={{ borderTop: '1px solid #111111', padding: '8px 10px', fontSize: '10.5px', lineHeight: 1.5 }}>
          <div>
            <strong>Regd. Office:</strong>{' '}
            {[data.company.addressLine1, data.company.addressLine2, data.company.city, data.company.state, data.company.postalCode]
              .filter(Boolean)
              .join(', ') || 'Registered Office Address'}
          </div>
          <div style={{ display: 'flex', gap: '40px' }}>
            <span>
              <strong>Email:</strong> {data.company.email || '-'}
            </span>
            <span>
              <strong>Website:</strong> {data.company.website || '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
