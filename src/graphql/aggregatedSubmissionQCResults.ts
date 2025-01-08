import gql from "graphql-tag";

// The base aggregatedQCResult model used for all aggregatedSubmissionQCResults queries
const BaseAggregatedQCResultFragment = gql`
  fragment BaseAggregatedQCResultFragment on aggregatedQCResult {
    code
    title
  }
`;

// The extended aggregatedQCResult model which includes all fields
const FullAggregatedQCResultFragment = gql`
  fragment AggregatedQCResultFragment on aggregatedQCResult {
    severity
    count
  }
`;

export const query = gql`
  query aggregatedSubmissionQCResults(
    $submissionID: ID!
    $severity: String
    $first: Int
    $offset: Int
    $orderBy: String
    $sortDirection: String
    $partial: Boolean = false
  ) {
    aggregatedSubmissionQCResults(
      submissionID: $submissionID
      severity: $severity
      first: $first
      offset: $offset
      orderBy: $orderBy
      sortDirection: $sortDirection
    ) {
      total
      results {
        ...BaseAggregatedQCResultFragment
        ...AggregatedQCResultFragment @skip(if: $partial)
      }
    }
  }
  ${FullAggregatedQCResultFragment}
  ${BaseAggregatedQCResultFragment}
`;

export type Input = {
  submissionID: string;
  severity?: string;
  first?: number;
  offset?: number;
  orderBy?: string;
  sortDirection?: string;
  partial?: boolean;
};

export type Response = {
  aggregatedSubmissionQCResults: ValidationResult<AggregatedQCResult>;
};
