export interface NsdlPayload {
  request: {
    nomineeDetails: NomineeDetails;
    personalDetails: PersonalDetails;
    otherDeatils: OtherDetails;
    additionalParameters: AdditionalParameters;
  };
}

export interface NomineeDetails {
  nomineeName: string;
  nomineeDob: string;
  relationship: string;
  add1: string;
  add2: string;
  add3: string;
  pin: string;
  nomineeState: string;
  nomineeCity: string;
}

export interface PersonalDetails {
  customername: string;
  customerLastName: string;
  dateofbirth: string;
  pincode: string;
  email: string;
  mobileNo: string;
}

export interface OtherDetails {
  maritalStatus: string;
  income: number;
  middleNameOfMother: string;
  houseOfFatherOrSpouse: string;
  kycFlag: string;
  panNo: string;
}

export interface AdditionalParameters {
  channelid: string;
  partnerid: string;
  applicationdocketnumber: string;
  dpid: string;
  clientid: string;
  partnerpan: string;
  tradingaccountnumber: string;

  partnerRefNumber: string;
  customerRefNumber: string;
  customerDematId: string;
  partnerCallBackURL: string;
  bcid: string;
  bcagentid: string;
}
