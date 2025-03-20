export default {
  "@context": {
    "@version": 1.1,
    "@protected": true,
    xsd: "http://www.w3.org/2001/XMLSchema#",
    aux: "https://raw.githubusercontent.com/idos-network/idos-sdk-js/168f449a799620123bc7b01fc224423739500f94/packages/issuer-sdk-js/assets/country-codes.xml",
    firstName: "xsd:string",
    familyName: "xsd:string",
    maidenName: "xsd:string",
    governmentId: "xsd:string",
    governmentIdType: "xsd:string",
    dateOfBirth: "aux:date",
    placeOfBirth: "xsd:string",
    idDocumentCountry: "xsd:string",
    idDocumentNumber: "xsd:string",
    idDocumentType: "xsd:string",
    idDocumentDateOfIssue: "aux:date",
    idDocumentDateOfExpiry: "aux:date",
    idDocumentFrontFile: "xsd:string",
    idDocumentBackFile: "xsd:string",
    selfieFile: "xsd:string",
    residentialAddress: "xsd:string",
    residentialAddressCountry: "aux:ISO_3166-1_alpha-2",
    residentialAddressProofCategory: "xsd:string",
    residentialAddressProofDateOfIssue: "xsd:date",
    residentialAddressProofFile: "xsd:string",
    issuanceDate: "xsd:date",
    expirationDate: "xsd:date",
  },
};
