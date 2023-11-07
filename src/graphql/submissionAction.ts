import gql from "graphql-tag";
// action in [Submit, Release, Withdraw, Reject, Complete, Cancel, Archive]
export const mutation = gql`
  mutation submissionAction($submissionID: ID!, $action: String!) {
    submissionAction(submissionID: $submissionID, action: $action) {
      _id
      status
      history {
        status
        reviewComment
        dateTime
        userID
      }
      createdAt
      updatedAt
    }
  }
`;

export type Response = {
  submissionAction: Submission;
};
