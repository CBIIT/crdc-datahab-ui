import gql from "graphql-tag";

// The base QCResult model used for all submissionQCResults queries
const BaseQCResultFragment = gql`
  fragment BaseQCResultFragment on QCResult {
    errors {
      title
      description
    }
  }
`;

// The extended QCResult model which includes all fields
const FullQCResultFragment = gql`
  fragment QCResultFragment on QCResult {
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
`;

export const query = gql`
  query submissionQCResults(
    $id: ID!
    $issueCode: String
    $nodeTypes: [String]
    $batchIDs: [ID]
    $severities: String
    $first: Int
    $offset: Int
    $orderBy: String
    $sortDirection: String
    $partial: Boolean = false
  ) {
    submissionQCResults(
      _id: $id
      issueCode: $issueCode
      nodeTypes: $nodeTypes
      batchIDs: $batchIDs
      severities: $severities
      first: $first
      offset: $offset
      orderBy: $orderBy
      sortDirection: $sortDirection
    ) {
      total
      results {
        ...BaseQCResultFragment
        ...QCResultFragment @skip(if: $partial)
      }
    }
  }
  ${FullQCResultFragment}
  ${BaseQCResultFragment}
`;

export type Input = {
  id: string;
  issueCode?: string;
  nodeTypes?: string[];
  batchIDs?: number[];
  severities?: string;
  first?: number;
  offset?: number;
  orderBy?: string;
  sortDirection?: string;
  partial?: boolean;
};

export type Response<IsPartial = false> = {
  submissionQCResults: ValidationResult<
    IsPartial extends true ? Pick<QCResult, "errors"> : QCResult
  >;
};
