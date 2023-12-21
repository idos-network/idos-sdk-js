export default {
  "@context": {
    "@version": 1.1,
    "@protected": true,
    xsd: "http://www.w3.org/2001/XMLSchema#",
    aux: "https://raw.githubusercontent.com/trustfractal/claim-schemas/master/aux.xml",
    level: "xsd:string",
    status: "xsd:string",
    approved_at: "xsd:date",
    emails: "xsd:string",
    phones: "xsd:string",
    residential_address: "xsd:string",
    residential_address_country: "aux:ISO_3166-1_alpha-2",
    residential_address_proof_date_of_expiry: "xsd:date",
    date_of_birth: "xsd:date",
    full_name: "xsd:string",
    identification_document_country: "aux:ISO_3166-1_alpha-2",
    identification_document_number: "xsd:string",
    identification_document_type: "aux:identification_document_type",
    place_of_birth: "xsd:string",
    identification_document_date_of_issue: "xsd:date",
    identification_document_date_of_expiry: "xsd:date",
    wallets: {
      "@id":
        "https://raw.githubusercontent.com/trustfractal/claim-schemas/master/verifiable_credential/fractal_id.json-ld#wallets",
      "@context": {
        "@protected": true,
        address: "xsd:string",
        currency: "xsd:string",
        verified: "xsd:boolean"
      }
    },
    identification_document_front_file: "xsd:string",
    identification_document_back_file: "xsd:string",
    identification_document_selfie_file: "xsd:string",
    residential_address_proof_file: "xsd:string"
  }
};
