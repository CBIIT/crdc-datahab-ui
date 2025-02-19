import gql from "graphql-tag";

export const mutation = gql`
  mutation createApprovedStudy(
    $name: String!
    $acronym: String
    $controlledAccess: Boolean!
    $openAccess: Boolean
    $dbGaPID: String
    $ORCID: String
    $PI: String
  ) {
    createApprovedStudy(
      name: $name
      acronym: $acronym
      controlledAccess: $controlledAccess
      openAccess: $openAccess
      dbGaPID: $dbGaPID
      ORCID: $ORCID
      PI: $PI
    ) {
      _id
      studyName
      studyAbbreviation
      dbGaPID
      controlledAccess
      openAccess
      PI
      ORCID
      createdAt
    }
  }
`;

export type Input = {
  name: string;
  acronym: string;
  controlledAccess: boolean;
  openAccess: boolean;
  dbGaPID: string;
  ORCID: string;
  PI: string;
};

export type Response = {
  createApprovedStudy: ApprovedStudy;
};
