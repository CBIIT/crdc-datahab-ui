import gql from "graphql-tag";

export const query = gql`
  query getUser($userID: ID!) {
    getUser(userID: $userID) {
      _id
      firstName
      lastName
      userStatus
      role
      IDP
      email
      createdAt
      updateAt
      dataCommons
      studies {
        _id
        studyName
        studyAbbreviation
      }
      permissions
      notifications
    }
  }
`;

export type Input = {
  userID: string;
};

export type Response = {
  getUser: User & {
    studies: Pick<ApprovedStudy, "_id" | "studyName" | "studyAbbreviation">[];
  };
};
