import { configureStore } from '@reduxjs/toolkit';
import ingredientsSlice, {
  fetchIngredients,
  selectIngredients,
  selectBuns,
  selectMains,
  selectSauces,
  selectIsLoading,
  initialState
} from '../ingredients-slice';
import { getIngredientsApi } from '@api';
import { TIngredient } from '@utils-types';

jest.mock('@api', () => ({
  getIngredientsApi: jest.fn()
}));

const mockIngredients: TIngredient[] = [
  {
    _id: '1',
    name: 'Bun',
    type: 'bun',
    proteins: 10,
    fat: 5,
    carbohydrates: 15,
    calories: 100,
    price: 200,
    image: 'bun.jpg',
    image_mobile: 'bun-mobile.jpg',
    image_large: 'bun-large.jpg'
  },
  {
    _id: '2',
    name: 'Main',
    type: 'main',
    proteins: 20,
    fat: 10,
    carbohydrates: 5,
    calories: 150,
    price: 150,
    image: 'main.jpg',
    image_mobile: 'main-mobile.jpg',
    image_large: 'main-large.jpg'
  },
  {
    _id: '3',
    name: 'Sauce',
    type: 'sauce',
    proteins: 5,
    fat: 2,
    carbohydrates: 10,
    calories: 50,
    price: 100,
    image: 'sauce.jpg',
    image_mobile: 'sauce-mobile.jpg',
    image_large: 'sauce-large.jpg'
  }
];

const mockBuns = mockIngredients.filter(i => i.type === 'bun');
const mockMains = mockIngredients.filter(i => i.type === 'main');
const mockSauces = mockIngredients.filter(i => i.type === 'sauce');

describe('ingredientsSlice', () => {
  const mockedApi = getIngredientsApi as jest.MockedFunction<typeof getIngredientsApi>;

  afterEach(jest.clearAllMocks);

  test('initial state', () => {
    expect(ingredientsSlice(undefined, { type: '' })).toEqual(initialState);
  });

  describe('fetchIngredients actions', () => {
    test('pending sets loading state', () => {
      const state = ingredientsSlice(initialState, fetchIngredients.pending('', undefined));
      expect(state).toEqual({ ...initialState, isLoading: true });
    });

    test('fulfilled stores ingredients data', () => {
      const action = fetchIngredients.fulfilled(mockIngredients, '', undefined);
      const state = ingredientsSlice(initialState, action);
      
      expect(state).toMatchObject({
        items: mockIngredients,
        buns: mockBuns,
        mains: mockMains,
        sauces: mockSauces,
        isLoading: false
      });
    });

    test('rejected sets error state', () => {
      const error = { message: 'Failed' };
      const action = fetchIngredients.rejected(new Error('Failed'), '', undefined, error);
      const state = ingredientsSlice(initialState, action);
      
      expect(state).toEqual({
        ...initialState,
        isLoading: false,
        error: expect.objectContaining({ message: 'Failed' })
      });
    });
  });

  describe('fetchIngredients thunk', () => {
    test('successful API call', async () => {
      mockedApi.mockResolvedValue(mockIngredients);
      const store = configureStore({ reducer: { ingredients: ingredientsSlice } });
      await store.dispatch(fetchIngredients());
      
      const state = store.getState().ingredients;
      expect(state.items).toEqual(mockIngredients);
      expect(state.buns).toEqual(mockBuns);
      expect(state.mains).toEqual(mockMains);
      expect(state.sauces).toEqual(mockSauces);
    });

    test('failed API call', async () => {
      mockedApi.mockRejectedValue(new Error('Network error'));
      const store = configureStore({ reducer: { ingredients: ingredientsSlice } });
      await store.dispatch(fetchIngredients());
      
      const state = store.getState().ingredients;
      expect(state.items).toEqual([]);
      expect(state.error?.message).toBe('Network error');
    });
  });

  describe('selectors', () => {
    const rootState = {
      builder: { constructorItems: { bun: null, ingredients: [] } },
      feed: { items: { orders: [], total: 0, totalToday: 0 }, loading: false, error: null },
      ingredients: {
        items: mockIngredients,
        buns: mockBuns,
        mains: mockMains,
        sauces: mockSauces,
        isLoading: false,
        error: null
      },
      order: { order: [], orderRequest: false, orderError: null, orderModalData: null, isLoadingNumber: false, isLoadingOrder: false },
      user: { data: null, isAuthenticated: false }
    };

    test('selectIngredients returns all items', () => {
      expect(selectIngredients(rootState)).toEqual(mockIngredients);
    });

    test('selectBuns returns bun items', () => {
      expect(selectBuns(rootState)).toEqual(mockBuns);
    });

    test('selectMains returns main items', () => {
      expect(selectMains(rootState)).toEqual(mockMains);
    });

    test('selectSauces returns sauce items', () => {
      expect(selectSauces(rootState)).toEqual(mockSauces);
    });

    test('selectIsLoading returns loading state', () => {
      expect(selectIsLoading(rootState)).toBe(false);
    });
  });
});