import gql from "graphql-tag";

export const query = gql`
  query getSubmission($id: ID!) {
    getSubmission(_id: $id) {
      _id
      name
      submitterID
      submitterName
      organization {
        _id
        name
      }
      dataCommons
      modelVersion
      studyID
      studyAbbreviation
      dbGaPID
      bucketName
      rootPath
      status
      metadataValidationStatus
      fileValidationStatus
      crossSubmissionStatus
      validationStarted
      validationEnded
      validationScope
      validationType
      deletingData
      fileErrors {
        submissionID
        type
        validationType
        batchID
        displayID
        submittedID
        severity
        uploadedDate
        validatedDate
        errors {
          title
          description
        }
        warnings {
          title
          description
        }
      }
      history {
        status
        reviewComment
        dateTime
        userID
        userName
      }
      conciergeName
      conciergeEmail
      intention
      dataType
      otherSubmissions
      nodeCount
      collaborators {
        collaboratorID
        collaboratorName
        permission
      }
      createdAt
      updatedAt
    }

    submissionStats(_id: $id) {
      stats {
        nodeName
        total
        new
        passed
        warning
        error
      }
    }

    batchStatusList: listBatches(submissionID: $id, first: -1) {
      batches {
        _id
        status
      }
    }
  }
`;

export type Input = {
  /**
   * The submission ID
   */
  id: string;
};

export type Response = {
  /**
   * The submission object
   */
  getSubmission: Submission;
  /**
   * The node statistics for the submission
   */
  submissionStats: {
    stats: SubmissionStatistic[];
  };
  /**
   * The full list of batches for the submission
   */
  batchStatusList: {
    batches: Pick<Batch, "_id" | "status">[];
  };
};
