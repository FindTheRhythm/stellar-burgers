import { configureStore } from '@reduxjs/toolkit';
import orderSlice, {
  createOrder,
  fetchOrderNumber,
  fetchOrder,
  orderDataSelector,
  selectOrders,
  selectOrderRequest,
  selectOrderModalData,
  closeOrderModalData,
  initialState
} from '../order-slice';
import { orderBurgerApi, getOrderByNumberApi, getOrdersApi } from '@api';
import { TOrder } from '@utils-types';

jest.mock('@api', () => ({
  orderBurgerApi: jest.fn(),
  getOrderByNumberApi: jest.fn(),
  getOrdersApi: jest.fn()
}));

const mockOrder: TOrder = {
  _id: '1',
  ingredients: ['ing1', 'ing2'],
  status: 'done',
  name: 'Order 1',
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
  number: 1
};

const mockOrders: TOrder[] = [
  mockOrder,
  {
    _id: '2',
    ingredients: ['ing3', 'ing4'],
    status: 'pending',
    name: 'Order 2',
    createdAt: '2023-01-02',
    updatedAt: '2023-01-02',
    number: 2
  }
];

describe('orderSlice', () => {
  afterEach(jest.clearAllMocks);

  test('initial state', () => {
    expect(orderSlice(undefined, { type: '' })).toEqual(initialState);
  });

  describe('reducer actions', () => {
    test('closeOrderModalData resets modal state', () => {
      const state = orderSlice(
        { ...initialState, orderModalData: mockOrder, orderRequest: true },
        closeOrderModalData()
      );
      
      expect(state.orderModalData).toBeNull();
      expect(state.orderRequest).toBe(false);
    });
  });

  describe('async thunks', () => {
    const store = configureStore({ reducer: { order: orderSlice } });

    describe('createOrder', () => {
      test('pending sets request state', () => {
        const state = orderSlice(initialState, createOrder.pending('', []));
        expect(state.orderRequest).toBe(true);
      });

      test('fulfilled sets modal data', () => {
        const action = createOrder.fulfilled({ order: mockOrder, name: 'Order' }, '', ['ing1', 'ing2']);
        const state = orderSlice(initialState, action);
        expect(state.orderModalData).toEqual(mockOrder);
      });

      test('rejected resets request state', () => {
        const state = orderSlice(initialState, createOrder.rejected(new Error(), '', []));
        expect(state.orderRequest).toBe(false);
      });

      test('successful API call', async () => {
        (orderBurgerApi as jest.Mock).mockResolvedValue({
          success: true,
          order: mockOrder,
          name: 'Order'
        });

        await store.dispatch(createOrder(['ing1', 'ing2']));
        const state = store.getState().order;
        expect(state.orderModalData).toEqual(mockOrder);
      });
    });

    describe('fetchOrderNumber', () => {
      test('pending sets loading state', () => {
        const state = orderSlice(initialState, fetchOrderNumber.pending('', 1));
        expect(state.isLoadingNumber).toBe(true);
      });

      test('fulfilled sets modal data', () => {
        const action = fetchOrderNumber.fulfilled(mockOrder, '', 1);
        const state = orderSlice(initialState, action);
        expect(state.orderModalData).toEqual(mockOrder);
      });

      test('rejected resets loading state', () => {
        const state = orderSlice(initialState, fetchOrderNumber.rejected(new Error(), '', 1));
        expect(state.isLoadingNumber).toBe(false);
      });

      test('successful API call', async () => {
        (getOrderByNumberApi as jest.Mock).mockResolvedValue({
          success: true,
          orders: [mockOrder]
        });

        await store.dispatch(fetchOrderNumber(1));
        const state = store.getState().order;
        expect(state.orderModalData).toEqual(mockOrder);
      });
    });

    describe('fetchOrder', () => {
      test('pending sets loading state', () => {
        const state = orderSlice(initialState, fetchOrder.pending('', undefined));
        expect(state.isLoadingOrder).toBe(true);
      });

      test('fulfilled stores orders', () => {
        const action = fetchOrder.fulfilled(mockOrders, '', undefined);
        const state = orderSlice(initialState, action);
        expect(state.order).toEqual(mockOrders);
      });

      test('rejected sets error state', () => {
        const error = { message: 'Error' };
        const action = fetchOrder.rejected(new Error(), '', undefined, error);
        const state = orderSlice(initialState, action);
        expect(state.orderError).toBeDefined();
      });

      test('successful API call', async () => {
        (getOrdersApi as jest.Mock).mockResolvedValue(mockOrders);
        await store.dispatch(fetchOrder());
        expect(store.getState().order.order).toEqual(mockOrders);
      });
    });
  });

  describe('selectors', () => {
    const createFeedState = (orders = mockOrders) => ({
      items: { orders, total: 0, totalToday: 0 },
      loading: false,
      error: null
    });
    const createState = (orderState = initialState) => ({
      order: orderState,
      feed: createFeedState(),
      builder: { constructorItems: { bun: null, ingredients: [] } },
      ingredients: { items: [], buns: [], mains: [], sauces: [], isLoading: false, error: null },
      user: { data: null, isAuthenticated: false }
    });

    test('selectOrders returns orders', () => {
      const state = createState({ ...initialState, order: mockOrders });
      expect(selectOrders(state)).toEqual(mockOrders);
    });

    test('selectOrderRequest returns request state', () => {
      const state = createState({ ...initialState, orderRequest: true });
      expect(selectOrderRequest(state)).toBe(true);
    });

    test('selectOrderModalData returns modal data', () => {
      const state = createState({ ...initialState, orderModalData: mockOrder });
      expect(selectOrderModalData(state)).toEqual(mockOrder);
    });

    describe('orderDataSelector', () => {
      const stateWithData = createState({
        ...initialState,
        order: mockOrders,
        orderModalData: mockOrder
      });

      test('finds order in order slice', () => {
        expect(orderDataSelector('1')(stateWithData)).toEqual(mockOrder);
      });

      test('finds order in feed slice', () => {
        expect(orderDataSelector('2')(stateWithData)).toEqual(mockOrders[1]);
      });

      test('returns modal data when order not found', () => {
        const state = createState({
          ...initialState,
          order: [],
          orderModalData: mockOrder
        });
        expect(orderDataSelector('999')(state)).toEqual(mockOrder);
      });

      test('returns null when no data found', () => {
        const state = createState(initialState);
        expect(orderDataSelector('999')(state)).toBeNull();
      });
    });
  });
});