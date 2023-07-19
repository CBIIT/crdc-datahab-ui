import { useLazyQuery } from '@apollo/client';
import React, {
  FC,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { GET_USER, GET_USER_Resp as getMyUserResp } from './graphql';

const AUTH_SERVICE_URL = `${window.origin}/api/authn`;

/**
 * Checks login status with AuthN
 *
 * @async
 * @param {none}
 * @returns Promise that resolves to true if logged in, false if not
 */
const userLogout = async () : Promise<boolean> => {
  const d = await fetch(`${AUTH_SERVICE_URL}/logout`, { method: 'POST' }).catch(() => null);
  const { status } = await d.json().catch(() => null);

  return status || false;
};

/**
 * Logs in to AuthN
 *
 * @async
 * @param {string} authCode Authorization code used to verify login
 * @returns Promise that resolves to true if successful, false if not
 */
const userLogin = async (authCode : string) : Promise<boolean> => {
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: authCode, IDP: 'nih', redirectUri: "" }),
  };

  try {
    const data = await fetch(`${AUTH_SERVICE_URL}/login`, options);
    const { timeout, error } = await data.json();

    return typeof timeout === "number" && typeof error === "undefined";
  } catch (e) {
    return false;
  }
};

export type ContextState = {
  status: Status;
  isLoggedIn: boolean;
  user: User;
  error?: string;
  logout?: () => Promise<boolean>;
  setData?: (data: UserInput) => Promise<boolean>;
};

export enum Status {
  LOADING = "LOADING", // Retrieving user data
  LOADED = "LOADED", // Successfully retrieved user data
  SAVING = "SAVING", // Saving user data updates
  ERROR = "ERROR", // Error retrieving user data
}

const initialState: ContextState = {
  isLoggedIn: false,
  status: Status.LOADING,
  user: null,
};

/**
 * Auth Context
 *
 * NOTE: Do NOT use this context directly. Use the useAuthContext hook instead.
 *       this is exported for testing purposes only.
 *
 * @see ContextState – Auth context state
 * @see useAuthContext – Auth context hook
 */
export const Context = createContext<ContextState>(initialState);
Context.displayName = 'AuthContext';

/**
 * Auth Context Hook
 *
 * @see AuthProvider – Must be wrapped in a AuthProvider component
 * @see ContextState – Auth context state returned by the hook
 * @returns {ContextState} - Auth context
 */
export const useAuthContext = (): ContextState => {
  const context = useContext<ContextState>(Context);

  if (!context) {
    throw new Error("AuthContext cannot be used outside of the AuthProvider component");
  }

  return context;
};

type ProviderProps = {
  children: React.ReactNode;
};

/**
 * Creates an auth context
 *
 * @see useAuthContext – Auth context hook
 * @param {ProviderProps} props - Auth context provider props
 * @returns {JSX.Element} - Auth context provider
 */
export const AuthProvider: FC<ProviderProps> = (props) => {
  const { children } = props;
  const [state, setState] = useState<ContextState>(initialState);

  const [getMyUser] = useLazyQuery<getMyUserResp>(GET_USER, {
    context: { clientName: 'userService' },
    fetchPolicy: 'no-cache',
  });

  const logout = async () : Promise<boolean> => {
    if (!state.isLoggedIn) return true;

    const status = await userLogout();
    if (status) {
      setState({ ...initialState, status: Status.LOADED });
    }

    return status;
  };

  const setData = async (data: UserInput) : Promise<boolean> => {
    if (!state.isLoggedIn) return false;

    // TODO: Implement updateMyUser mutation

    return false;
  };

  useEffect(() => {
    (async () => {
      // User has an active session, restore it
      const userDetails = JSON.parse(localStorage.getItem('userDetails'));
      if (userDetails) {
        // Make cached data available to app immediately
        setState({ isLoggedIn: true, status: Status.LOADED, user: userDetails });

        const { data, error } = await getMyUser();
        if (error || !data?.getMyUser) {
          setState({ ...initialState, status: Status.LOADED });
          return;
        }

        setState({ ...state, isLoggedIn: true, status: Status.LOADED, user: data?.getMyUser });
        return;
      }

      // User came from NIH SSO, login to AuthN
      const searchParams = new URLSearchParams(document.location.search);
      const authCode = searchParams.get('code');
      if (authCode && await userLogin(authCode)) {
        const { data, error } = await getMyUser();
        if (error || !data?.getMyUser) {
          setState({ ...initialState, status: Status.LOADED });
          return;
        }

        window.history.replaceState({}, document.title, window.location.pathname);
        setState({ isLoggedIn: true, status: Status.LOADED, user: data?.getMyUser });
        return;
      }

      // User is not logged in or login failed
      setState({ ...initialState, status: Status.LOADED });
    })();
  }, []);

  useEffect(() => {
    if (state.isLoggedIn && typeof state.user === 'object') {
      localStorage.setItem('userDetails', JSON.stringify(state.user));
      return;
    }

    localStorage.removeItem('userDetails');
  }, [state.user]);

  const value = useMemo(() => ({ ...state, logout, setData }), [state]);

  return (
    <Context.Provider value={value}>
      {children}
    </Context.Provider>
  );
};
