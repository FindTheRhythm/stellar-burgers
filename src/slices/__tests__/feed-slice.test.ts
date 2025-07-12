import { configureStore } from '@reduxjs/toolkit';
import feedSlice, {
  feedThunk,
  selectFeed,
  selectLoading,
  selectError,
  selectOrders,
  initialState
} from '../feed-slice';
import { TOrdersData, TOrder } from '@utils-types';
import { getFeedsApi } from '@api';

jest.mock('@api', () => ({
  getFeedsApi: jest.fn()
}));

const mockedGetFeedsApi = getFeedsApi as jest.MockedFunction<typeof getFeedsApi>;

describe('feedSlice', () => {
  const mockOrder: TOrder = {
    _id: '1',
    status: 'done',
    ingredients: ['ing1', 'ing2'],
    createdAt: 'date',
    updatedAt: 'date',
    number: 1,
    name: 'Order 1'
  };

  const mockOrdersData: TOrdersData = {
    orders: [mockOrder],
    total: 100,
    totalToday: 10
  };

  const mockApiResponse = {
    ...mockOrdersData,
    success: true
  };

  afterEach(jest.clearAllMocks);

  test('initial state', () => {
    expect(feedSlice(undefined, { type: '' })).toEqual(initialState);
  });

  describe('reducer cases', () => {
    test('pending state', () => {
      const state = feedSlice(initialState, feedThunk.pending('', undefined));
      expect(state).toEqual({ ...initialState, loading: true });
    });

    test('fulfilled state', () => {
      const state = feedSlice(initialState, feedThunk.fulfilled(mockApiResponse, '', undefined));
      expect(state).toEqual({ ...initialState, items: mockApiResponse });
    });

    test('rejected state', () => {
      const error = { message: 'Error' };
      const state = feedSlice(initialState, feedThunk.rejected(new Error(), '', undefined, error));
      expect(state).toMatchObject({ ...initialState, error: expect.anything() });
    });
  });

  describe('feedThunk', () => {
    test('successful data fetch', async () => {
      mockedGetFeedsApi.mockResolvedValue(mockApiResponse);
      const store = configureStore({ reducer: { feed: feedSlice } });
      await store.dispatch(feedThunk());
      
      const state = store.getState().feed;
      expect(state.items).toEqual(mockApiResponse);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    test('failed data fetch', async () => {
      const error = new Error('Network Error');
      mockedGetFeedsApi.mockRejectedValue(error);
      const store = configureStore({ reducer: { feed: feedSlice } });
      await store.dispatch(feedThunk());
      
      const state = store.getState().feed;
      expect(state.items).toBeNull();
      expect(state.error?.message).toBe('Network Error');
    });
  });

  describe('selectors', () => {
    const createState = (feedState = initialState) => ({
      feed: feedState,
      builder: {} as any,
      ingredients: {} as any,
      order: {} as any,
      user: {} as any
    });

    test('selectFeed returns feed items', () => {
      const state = createState({ ...initialState, items: mockApiResponse });
      expect(selectFeed(state)).toEqual(mockApiResponse);
    });

    test('selectLoading returns loading state', () => {
      const state = createState({ ...initialState, loading: true });
      expect(selectLoading(state)).toBe(true);
    });

    test('selectError returns error', () => {
      const error = { message: 'Test error' };
      const state = createState({ ...initialState, error });
      expect(selectError(state)).toEqual(error);
    });

    test('selectOrders returns orders array', () => {
      const state = createState({ ...initialState, items: mockApiResponse });
      expect(selectOrders(state)).toEqual(mockApiResponse.orders);
    });

    test('selectOrders returns empty array when no items', () => {
      const state = createState();
      expect(selectOrders(state)).toEqual([]);
    });
  });
});