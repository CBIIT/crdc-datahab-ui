import gql from "graphql-tag";

export const query = gql`
  query getApplication($id: ID!) {
    getApplication(_id: $id) {
      _id
      status
      createdAt
      updatedAt
      submittedDate
      openAccess
      controlledAccess
      PI
      history {
        status
        reviewComment
        dateTime
        userID
      }
      applicant {
        applicantID
        applicantName
      }
      organization {
        _id
        name
      }
      programName
      studyAbbreviation
      questionnaireData
    }
  }
`;

export type Response = {
  getApplication: Omit<Application, "questionnaireData"> & {
    questionnaireData: string; // Cast to QuestionnaireData
  };
};
