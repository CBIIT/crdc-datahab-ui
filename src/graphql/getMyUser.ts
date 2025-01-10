import gql from "graphql-tag";

export const query = gql`
  query getMyUser {
    getMyUser {
      _id
      firstName
      lastName
      userStatus
      role
      IDP
      email
      dataCommons
      studies {
        _id
        studyName
        studyAbbreviation
        dbGaPID
        controlledAccess
      }
      permissions
      notifications
      createdAt
      updateAt
    }
  }
`;

export type Response = {
  getMyUser: User & {
    studies: Pick<
      ApprovedStudy,
      "_id" | "studyName" | "studyAbbreviation" | "dbGaPID" | "controlledAccess"
    >[];
  };
};
