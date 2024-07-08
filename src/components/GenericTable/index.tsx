/* eslint-disable react/no-array-index-key */
import {
  Table,
  TableBody,
  TableCell,
  TableCellProps,
  TableContainer,
  TableContainerProps,
  TableHead,
  TablePaginationProps,
  TableProps,
  TableRow,
  TableSortLabel,
  Typography,
  styled,
} from "@mui/material";
import {
  CSSProperties,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { isEqual } from "lodash";
import SuspenseLoader from "../SuspenseLoader";
import TablePagination from "./TablePagination";
import {
  generateSearchParameters,
  validatePage,
  validateRowsPerPage,
  validateSortDirection,
} from "../../utils";
import { tableStateReducer } from "./TableReducer";
import { useSearchParamsContext } from "../Contexts/SearchParamsContext";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";

const StyledTableContainer = styled(TableContainer)({
  borderRadius: "8px",
  border: "1px solid #6CACDA",
  marginBottom: "25px",
  position: "relative",
  overflow: "hidden",
  "& .MuiTableRow-root:nth-of-type(2n)": {
    background: "#E3EEF9",
  },
  "& .MuiTableCell-root:first-of-type": {
    paddingLeft: "40.44px",
  },
  "& .MuiTableCell-root:last-of-type": {
    paddingRight: "40.44px",
  },
});

const StyledTableWrapper = styled("div")({
  overflowX: "auto",
  width: "100%",
});

const StyledTableHead = styled(TableHead)({
  background: "#4D7C8F",
  borderBottom: "2px solid #083A50",
});

const StyledTableRow = styled(TableRow)({
  height: "46.59px",
  minHeight: "46.59px",
});

const StyledHeaderCell = styled(TableCell)({
  fontWeight: 700,
  fontSize: "16px",
  lineHeight: "16px",
  color: "#fff !important",
  padding: "22px 53px 22px 16px",
  verticalAlign: "top",
  "&.MuiTableCell-root:first-of-type": {
    paddingTop: "22px",
    paddingRight: "16px",
    paddingBottom: "22px",
    color: "#fff !important",
  },
  "& .MuiSvgIcon-root, & .MuiButtonBase-root": {
    color: "#fff !important",
  },
});

const StyledTableCell = styled(TableCell)({
  fontSize: "16px",
  color: "#083A50 !important",
  fontFamily: "'Nunito', 'Rubik', sans-serif",
  fontStyle: "normal",
  fontWeight: 400,
  lineHeight: "19.6px",
  "&.MuiTableCell-root": {
    padding: "13px 16px",
  },
});

export type Column<T> = {
  label: string | React.ReactNode;
  renderValue: (a: T) => React.ReactNode;
  field?: keyof T;
  fieldKey?: string; // optional, used for custom unique identifier while sorting
  default?: true;
  sortDisabled?: boolean;
  comparator?: (a: T, b: T) => number;
  sx?: TableCellProps["sx"];
};

export type Props<T> = {
  columns: Column<T>[];
  data: T[];
  total: number;
  loading?: boolean;
  disableUrlParams?: boolean;
  position?: PaginationPosition;
  noContentText?: string;
  defaultOrder?: Order;
  defaultRowsPerPage?: number;
  rowsPerPageOptions?: number[];
  paginationPlacement?: CSSProperties["justifyContent"];
  tableProps?: TableProps;
  containerProps?: TableContainerProps;
  numRowsNoContent?: number;
  AdditionalActions?: React.ReactNode;
  CustomTableHead?: React.ElementType<React.ComponentProps<typeof TableHead>>;
  CustomTableHeaderCell?: React.ElementType<React.ComponentProps<typeof TableCell>>;
  CustomTableBodyCell?: React.ElementType<React.ComponentProps<typeof TableCell>>;
  setItemKey?: (item: T, index: number) => string;
  onFetchData?: (params: FetchListing<T>, force: boolean) => void;
  onOrderChange?: (order: Order) => void;
  onOrderByChange?: (orderBy: Column<T>) => void;
  onPerPageChange?: (perPage: number) => void;
};

const GenericTable = <T,>(
  {
    columns,
    data: initData = [],
    total: initTotal = 0,
    loading,
    disableUrlParams = true,
    position = "bottom",
    noContentText,
    defaultOrder = "desc",
    defaultRowsPerPage = 10,
    rowsPerPageOptions = [5, 10, 20, 50],
    paginationPlacement,
    tableProps,
    containerProps,
    numRowsNoContent = 10,
    AdditionalActions,
    CustomTableHead,
    CustomTableHeaderCell,
    CustomTableBodyCell,
    setItemKey,
    onFetchData,
    onOrderChange,
    onOrderByChange,
    onPerPageChange,
  }: Props<T>,
  ref: React.Ref<TableMethods>
) => {
  const showDelayedLoading = useDelayedLoading(loading, 200);
  const { searchParams, setSearchParams } = useSearchParamsContext();
  const defaultColumn: Column<T> =
    columns.find((c) => c.default) || columns.find((c) => c.fieldKey ?? c.field);
  const initialTableParams: TableParams = {
    page: 0,
    perPage: defaultRowsPerPage,
    sortDirection: defaultOrder,
    orderBy: defaultColumn?.fieldKey ?? defaultColumn?.field?.toString(),
  };
  const initialState: TableState<T> = {
    ...initialTableParams,
    data: initData,
    total: initTotal,
    perPageOptions: rowsPerPageOptions,
  };
  const [{ data, total, page, perPage, sortDirection, orderBy, perPageOptions }, dispatch] =
    useReducer(tableStateReducer, initialState);
  const [paramsInitialized, setParamsInitialized] = useState<boolean>(false);

  const TableHeadComponent = CustomTableHead || StyledTableHead;
  const TableHeaderCellComponent = CustomTableHeaderCell || StyledHeaderCell;
  const TableBodyCellComponent = CustomTableBodyCell || StyledTableCell;
  const orderByColumn = columns?.find((c) => (c.fieldKey ?? c.field?.toString()) === orderBy);
  const prevFetchRef = useRef<FetchListing<T>>(null);

  useEffect(() => {
    if (loading) {
      return;
    }
    dispatch({ type: "SET_DATA", payload: initData });
  }, [loading, initData]);

  useEffect(() => {
    if (loading) {
      return;
    }
    dispatch({ type: "SET_TOTAL", payload: initTotal });
  }, [loading, initTotal]);

  useEffect(() => {
    if (disableUrlParams) {
      setParamsInitialized(true);
      return;
    }
    if (loading) {
      return;
    }

    const newSortDirection = searchParams.get("sortDirection") || initialState.sortDirection;
    const newOrderBy = searchParams.get("orderBy") || initialState.orderBy;
    const newPage = parseInt(searchParams.get("page"), 10) - 1 || initialState.page;
    const newRowsPerPage = parseInt(searchParams.get("perPage"), 10) || initialState.perPage;

    const allUpdates: Partial<TableState<T>> = {};

    if (validateSortDirection(newSortDirection)) {
      allUpdates.sortDirection = newSortDirection;
    }

    const orderByColumn: Column<T> = columns.find((c) => newOrderBy === (c.fieldKey ?? c.field));
    if (orderByColumn) {
      allUpdates.orderBy = orderByColumn.fieldKey ?? orderByColumn.field?.toString();
    }

    const isRowsPerPageValid = validateRowsPerPage(newRowsPerPage, perPageOptions);
    if (isRowsPerPageValid) {
      allUpdates.perPage = newRowsPerPage;
    }

    if (validatePage(newPage)) {
      allUpdates.page = newPage;
    } else {
      searchParams.delete("page"); // reset page to default
      setSearchParams(searchParams);
    }

    dispatch({ type: "SET_ALL", payload: allUpdates });
    setParamsInitialized(true);
  }, [
    total,
    data,
    loading,
    disableUrlParams,
    searchParams.get("sortDirection"),
    searchParams.get("orderBy"),
    searchParams.get("page"),
    searchParams.get("perPage"),
  ]);

  const fetchData = (force = false) => {
    if (!onFetchData) {
      return;
    }
    if (!paramsInitialized && !disableUrlParams) {
      return;
    }
    if (!validatePage(page)) {
      return;
    }
    const orderByColumn = columns?.find((c) => (c.fieldKey ?? c.field?.toString()) === orderBy);
    const fieldKey = orderByColumn?.fieldKey ?? orderByColumn?.field?.toString();
    const fetchListing: FetchListing<T> = {
      first: perPage,
      offset: page * perPage,
      sortDirection,
      orderBy: fieldKey,
      comparator: orderByColumn?.comparator,
    };

    if (!force && isEqual(fetchListing, prevFetchRef.current)) {
      return;
    }
    prevFetchRef.current = fetchListing;
    onFetchData(fetchListing, force);
  };

  const emptyRows = useMemo(
    () => (page > 0 && total ? Math.max(0, (1 + page) * perPage - (total || 0)) : 0),
    [data]
  );

  const handleRequestSort = (column: Column<T>) => {
    const fieldKey = column.fieldKey ?? column.field?.toString();
    const newOrder = orderByColumn === column && sortDirection === "asc" ? "desc" : "asc";

    if (typeof onOrderChange === "function") {
      onOrderChange(newOrder);
    }
    if (typeof onOrderByChange === "function") {
      onOrderByChange(column);
    }

    if (!disableUrlParams) {
      const updatedParams = generateSearchParameters(
        searchParams,
        {
          page: page + 1,
          perPage,
          orderBy: fieldKey,
          sortDirection: newOrder,
        },
        { ...initialTableParams, page: initialTableParams.page + 1 } // convert to 1-based indexing
      );
      setSearchParams(updatedParams);
    }

    dispatch({ type: "SET_ORDER_BY", payload: fieldKey });
    dispatch({ type: "SET_SORT_DIRECTION", payload: newOrder });
  };

  const handleChangeRowsPerPage = (event) => {
    const newPerPage = parseInt(event.target.value, 10);
    if (typeof onPerPageChange === "function") {
      onPerPageChange(newPerPage);
    }

    if (!disableUrlParams) {
      const updatedParams = generateSearchParameters(
        searchParams,
        {
          page: initialState.page + 1,
          perPage: newPerPage,
          orderBy,
          sortDirection,
        },
        { ...initialTableParams, page: initialTableParams.page + 1 } // convert to 1-based indexing
      );
      setSearchParams(updatedParams);
    }

    dispatch({ type: "SET_PAGE", payload: 0 });
    dispatch({ type: "SET_PER_PAGE", payload: newPerPage });
  };

  const handlePageChange = (newPage: number) => {
    // initial URL params not set, avoid changing page too early
    if (!paramsInitialized) {
      return;
    }

    if (!disableUrlParams) {
      const updatedParams = generateSearchParameters(
        searchParams,
        {
          page: newPage + 1,
          perPage,
          orderBy,
          sortDirection,
        },
        { ...initialTableParams, page: initialTableParams.page + 1 } // convert to 1-based indexing
      );
      setSearchParams(updatedParams);
    }

    dispatch({ type: "SET_PAGE", payload: newPage });
  };

  useEffect(() => {
    if (!paramsInitialized) {
      return;
    }
    fetchData();
  }, [page, perPage, sortDirection, orderBy, paramsInitialized]);

  useImperativeHandle(ref, () => ({
    refresh: () => {
      fetchData(true);
    },
    setPage: (newPage: number, forceRefetch = false) => {
      handlePageChange(newPage);
      if (newPage === page && forceRefetch) {
        fetchData(true);
      }
    },
  }));

  const Pagination = useCallback(
    ({
      disabled,
      verticalPlacement,
      ...rest
    }: Partial<TablePaginationProps> & {
      verticalPlacement: "top" | "bottom";
      disabled: boolean;
    }) => {
      const pageIsInvalid = page + 1 > Math.ceil(total / perPage);
      const safePage = pageIsInvalid ? 0 : page;

      return (
        <TablePagination
          disabled={disabled}
          total={total}
          perPage={perPage}
          page={safePage}
          verticalPlacement={verticalPlacement}
          placement={paginationPlacement}
          rowsPerPageOptions={rowsPerPageOptions}
          AdditionalActions={AdditionalActions}
          onPageChange={(_, newPage) => handlePageChange(newPage - 1)}
          onRowsPerPageChange={handleChangeRowsPerPage}
          {...rest}
        />
      );
    },
    [total, perPage, page, paginationPlacement, rowsPerPageOptions, AdditionalActions]
  );

  return (
    <StyledTableContainer {...containerProps}>
      {(!paramsInitialized || showDelayedLoading) && <SuspenseLoader fullscreen={false} />}
      {(position === "top" || position === "both") && (
        <Pagination verticalPlacement="top" disabled={!data || loading || !paramsInitialized} />
      )}
      <StyledTableWrapper>
        <Table {...tableProps}>
          {columns?.length > 0 && (
            <TableHeadComponent>
              <TableRow>
                {columns.map((col: Column<T>, index: number) => (
                  <TableHeaderCellComponent
                    key={typeof col.label === "string" ? col.label : `column_${index}`}
                    sx={col.sx}
                    data-testid={`generic-table-header-${
                      (typeof col.label === "string" ? col.label : null) ||
                      (typeof col.fieldKey === "string" ? col.fieldKey : null) ||
                      (typeof col.field === "string" ? col.field : null) ||
                      `column_${index}`
                    }`}
                  >
                    {!col.sortDisabled ? (
                      <TableSortLabel
                        active={orderByColumn === col}
                        direction={orderByColumn === col ? sortDirection : "asc"}
                        onClick={() => handleRequestSort(col)}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : (
                      col.label
                    )}
                  </TableHeaderCellComponent>
                ))}
              </TableRow>
            </TableHeadComponent>
          )}
          <TableBody>
            {(!paramsInitialized || showDelayedLoading) && (total === 0 || !data?.length)
              ? Array.from(Array(numRowsNoContent).keys())?.map((_, idx) => (
                  <StyledTableRow key={`loading_row_${idx}`}>
                    <TableCell colSpan={columns.length} />
                  </StyledTableRow>
                ))
              : data?.map((d: T, idx: number) => {
                  const itemKey = setItemKey ? setItemKey(d, idx) : d["_id"];
                  return (
                    <TableRow tabIndex={-1} hover key={itemKey}>
                      {columns.map((col: Column<T>) => (
                        <TableBodyCellComponent
                          key={`${itemKey}_${col.label}`}
                          sx={{
                            borderBottom:
                              idx !== (data?.length ?? 0) - 1 ? "1px solid #6B7294" : "none",
                          }}
                          data-testid="table-body-cell-with-data"
                        >
                          {col.renderValue(d)}
                        </TableBodyCellComponent>
                      ))}
                    </TableRow>
                  );
                })}

            {!showDelayedLoading &&
              paramsInitialized &&
              emptyRows > 0 &&
              Array.from(Array(emptyRows).keys())?.map((row) => (
                <StyledTableRow key={`empty_row_${row}`}>
                  <TableCell colSpan={columns.length} />
                </StyledTableRow>
              ))}

            {/* No content message */}
            {!showDelayedLoading &&
              paramsInitialized &&
              (!total || total === 0 || (total && !data?.length)) && (
                <TableRow style={{ height: 46 * numRowsNoContent }}>
                  <TableCell colSpan={columns.length}>
                    <Typography
                      variant="body1"
                      align="center"
                      fontSize={18}
                      fontWeight={500}
                      color="#757575"
                    >
                      {noContentText || "No existing data was found"}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>
      </StyledTableWrapper>
      {(position === "bottom" || position === "both") && (
        <Pagination verticalPlacement="bottom" disabled={!data || loading || !paramsInitialized} />
      )}
    </StyledTableContainer>
  );
};

const TableWithRef = forwardRef(GenericTable) as <T>(
  props: Props<T> & { ref?: React.Ref<TableMethods> }
) => ReturnType<typeof GenericTable>;

export default TableWithRef;
