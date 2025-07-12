import { configureStore } from '@reduxjs/toolkit';
import userSlice, {
  registerUser,
  loginUser,
  logoutUser,
  fetchUser,
  updateUser,
  selectIsAuthenticated,
  selectUserData,
  selectLoginError,
  selectRegisterError,
  initialState
} from '../user-slice';
import {
  registerUserApi,
  loginUserApi,
  logoutApi,
  getUserApi,
  updateUserApi
} from '@api';
import { TUser } from '@utils-types';

jest.mock('@api', () => ({
  registerUserApi: jest.fn(),
  loginUserApi: jest.fn(),
  logoutApi: jest.fn(),
  getUserApi: jest.fn(),
  updateUserApi: jest.fn()
}));

jest.mock('../../utils/cookie', () => ({
  setCookie: jest.fn(),
  deleteCookie: jest.fn()
}));

const mockUser: TUser = {
  name: 'Test User',
  email: 'test@example.com'
};

const mockAuthResponse = {
  success: true,
  user: mockUser,
  accessToken: 'access-token',
  refreshToken: 'refresh-token'
};

describe('userSlice', () => {
  const setCookie = jest.requireMock('../../utils/cookie').setCookie;
  const deleteCookie = jest.requireMock('../../utils/cookie').deleteCookie;
  
  afterEach(jest.clearAllMocks);

  test('initial state', () => {
    expect(userSlice(undefined, { type: '' })).toEqual(initialState);
  });

  describe('async thunks', () => {
    const store = configureStore({ reducer: { user: userSlice } });

    describe('registerUser', () => {
      test('pending clears errors', () => {
        const state = userSlice(
          { ...initialState, registerError: { name: 'Error', message: 'Error' } }, 
          registerUser.pending('', { name: 'Test', email: 'test@test.com', password: 'password' })
        );
        expect(state.registerError).toBeNull();
      });

      test('fulfilled sets user data', () => {
        const action = registerUser.fulfilled(mockUser, '', { name: 'Test', email: 'test@test.com', password: 'password' });
        const state = userSlice(initialState, action);
        expect(state.data).toEqual(mockUser);
        expect(state.isAuthenticated).toBe(true);
      });

      test('rejected sets error', () => {
        const error = { name: 'Failed', message: 'Failed' };
        const action = registerUser.rejected(new Error(), '', { name: 'Test', email: 'test@test.com', password: 'password' }, error);
        const state = userSlice(initialState, action);
        expect(state.registerError).toEqual(error);
      });

      test('successful API call', async () => {
        (registerUserApi as jest.Mock).mockResolvedValue(mockAuthResponse);
        await store.dispatch(registerUser({ 
          name: 'Test', 
          email: 'test@test.com', 
          password: 'password' 
        }));
        
        expect(setCookie).toHaveBeenCalledTimes(2);
        expect(store.getState().user.data).toEqual(mockUser);
      });
    });

    describe('loginUser', () => {
      test('pending clears errors', () => {
        const state = userSlice(
          { ...initialState, loginError: { name: 'Error', message: 'Error' } }, 
          loginUser.pending('', { email: 'test@test.com', password: 'password' })
        );
        expect(state.loginError).toBeNull();
      });

      test('fulfilled sets user data', () => {
        const action = loginUser.fulfilled(mockUser, '', { email: 'test@test.com', password: 'password' });
        const state = userSlice(initialState, action);
        expect(state.data).toEqual(mockUser);
        expect(state.isAuthenticated).toBe(true);
      });

      test('rejected sets error', () => {
        const error = { name: 'Failed', message: 'Failed' };
        const action = loginUser.rejected(new Error(), '', { email: 'test@test.com', password: 'password' }, error);
        const state = userSlice(initialState, action);
        expect(state.loginError).toEqual(error);
      });

      test('successful API call', async () => {
        (loginUserApi as jest.Mock).mockResolvedValue(mockAuthResponse);
        await store.dispatch(loginUser({ 
          email: 'test@test.com', 
          password: 'password' 
        }));
        
        expect(setCookie).toHaveBeenCalledWith('accessToken', 'access-token');
        expect(store.getState().user.isAuthenticated).toBe(true);
      });
    });

    describe('logoutUser', () => {
      test('fulfilled clears user data', () => {
        const state = userSlice(
          { data: mockUser, isAuthenticated: true }, 
          logoutUser.fulfilled(undefined, '', undefined)
        );
        expect(state.data).toBeNull();
        expect(state.isAuthenticated).toBe(false);
      });

      test('successful API call', async () => {
        (logoutApi as jest.Mock).mockResolvedValue({ success: true });
        store.dispatch(logoutUser());
        
        await new Promise(process.nextTick);
        expect(deleteCookie).toHaveBeenCalledWith('accessToken');
        expect(store.getState().user.isAuthenticated).toBe(false);
      });
    });

    describe('fetchUser', () => {
      test('fulfilled sets user data', () => {
        const action = fetchUser.fulfilled(mockUser, '', undefined);
        const state = userSlice(initialState, action);
        expect(state.data).toEqual(mockUser);
        expect(state.isAuthenticated).toBe(true);
      });

      test('successful API call', async () => {
        (getUserApi as jest.Mock).mockResolvedValue({ success: true, user: mockUser });
        await store.dispatch(fetchUser());
        expect(store.getState().user.data).toEqual(mockUser);
      });
    });

    describe('updateUser', () => {
      test('fulfilled updates user data', () => {
        const updatedUser = { ...mockUser, name: 'Updated' };
        const action = updateUser.fulfilled(updatedUser, '', { name: 'Updated', email: 'test@test.com', password: 'password' });
        const state = userSlice(
          { data: mockUser, isAuthenticated: true }, 
          action
        );
        expect(state.data).toEqual(updatedUser);
      });

      test('successful API call', async () => {
        const updatedUser = { ...mockUser, name: 'Updated' };
        (updateUserApi as jest.Mock).mockResolvedValue({ 
          success: true, 
          user: updatedUser 
        });
        
        await store.dispatch(updateUser(updatedUser));
        expect(store.getState().user.data).toEqual(updatedUser);
      });
    });
  });

  describe('selectors', () => {
    const createState = (userState = initialState) => ({
      user: userState,
      feed: { items: { orders: [], total: 0, totalToday: 0 }, loading: false, error: null },
      builder: { constructorItems: { bun: null, ingredients: [] } },
      ingredients: { items: [], buns: [], mains: [], sauces: [], isLoading: false, error: null },
      order: { order: [], orderRequest: false, orderError: null, orderModalData: null, isLoadingNumber: false, isLoadingOrder: false }
    });

    test('selectIsAuthenticated returns auth status', () => {
      const state = createState({ ...initialState, isAuthenticated: true });
      expect(selectIsAuthenticated(state)).toBe(true);
    });

    test('selectUserData returns user data', () => {
      const state = createState({ ...initialState, data: mockUser });
      expect(selectUserData(state)).toEqual(mockUser);
    });

    test('selectLoginError returns login error', () => {
      const error = { message: 'Login failed' };
      const state = createState({ ...initialState, loginError: error });
      expect(selectLoginError(state)).toEqual(error);
    });

    test('selectRegisterError returns register error', () => {
      const error = { message: 'Register failed' };
      const state = createState({ ...initialState, registerError: error });
      expect(selectRegisterError(state)).toEqual(error);
    });
  });
});