import gql from "graphql-tag";

// The base Batch model used for all listBatches queries
const BaseBatchFragment = gql`
  fragment BaseBatchFragment on Batch {
    _id
    displayID
    createdAt
    updatedAt
  }
`;

// The extended batch model which includes all fields
const FullBatchFragment = gql`
  fragment BatchFragment on Batch {
    submissionID
    type
    fileCount
    files {
      nodeType
      filePrefix
      fileName
      size
      status
      errors
      createdAt
      updatedAt
    }
    status
    errors
  }
`;

export const query = gql`
  query listBatches(
    $submissionID: ID!
    $first: Int
    $offset: Int
    $orderBy: String
    $sortDirection: String
    $partial: Boolean = false
  ) {
    listBatches(
      submissionID: $submissionID
      first: $first
      offset: $offset
      orderBy: $orderBy
      sortDirection: $sortDirection
    ) {
      total
      batches {
        ...BaseBatchFragment
        ...BatchFragment @skip(if: $partial)
      }
    }
    batchStatusList: listBatches(submissionID: $submissionID, first: -1) {
      batches {
        _id
        status
      }
    }
  }
  ${FullBatchFragment}
  ${BaseBatchFragment}
`;

export type Input = {
  submissionID: string;
  first?: number;
  offset?: number;
  orderBy?: keyof Batch;
  sortDirection?: string;
  partial?: boolean;
};

export type Response = {
  listBatches: ListBatches;
  batchStatusList: {
    batches: Pick<Batch, "_id" | "status">[];
  };
};
