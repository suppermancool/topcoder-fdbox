'use strict';

module.exports = {
  // Default invoice data
  defaultInvoiceData: {
    amountLabel: 'Betrag',
    companyAddress1: 'Bergheidengasse 26 Haus 3/1',
    companyAddress2: '1130 Wien',
    companyLogo: 'images/fdbox-logo.png',
    companyName: 'FBDOX.at GmbH',
    companyVAT: 'ATU72719436',
    companyVatNumberLabel: 'Firma VAT N°',
    currencyPositionBefore: false,
    currencySymbol: '€',
    currency: 'EUR',
    dateFormat: 'LL',
    descriptionLabel: 'Beschreibung',
    dueOnLabel: 'Fällig am',
    invoiceLabel: 'RECHNUNG',
    invoiceDateLabel: 'Rechnungsdatum',
    invoiceDueDateLabel: 'Geburtstermin',
    invoiceNumberLabel: 'Rechnungsnummer',
    invoiceFromLabel: 'Leistungserbringer',
    invoiceToLabel: 'Leistungsempfänger',
    language: 'de',
    localeString: 'de-DE',
    paidOnLabel: 'bezahlt am',
    priceLabel: 'Preis',
    productLabel: 'Produktgebühr',
    refNumberLabel: 'ref N°',
    subTotalLabel: 'Zwischensumme',
    totalLabel: 'Gesamt',
    unitLabel: 'teil',
    vatLabel: 'Umsatzsteuer'
  },
  //default PDF generation options
  defaultPdfOptions: {
    format: 'A4',
    orientation: 'portrait',
    type: 'pdf'
  }
};
