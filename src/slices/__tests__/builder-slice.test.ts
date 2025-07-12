import builderSlice, {
  addBunBuilder,
  addItemBuilder,
  deleteItemBuilder,
  moveItems,
  clearBuilder,
  selectConstructorItems,
  selectBun,
  selectConstructorTotalCount
} from '../builder-slice';
import { TConstructorIngredient, TIngredient } from '@utils-types';
import { v4 as uuidv4 } from 'uuid';

describe('builderSlice', () => {
  const mockBun: TConstructorIngredient = {
    _id: 'bun1',
    name: 'Bun1',
    type: 'bun',
    proteins: 5,
    fat: 5,
    carbohydrates: 5,
    calories: 100,
    price: 100,
    image: 'image.png',
    image_mobile: 'image-mobile.png',
    image_large: 'image-large.png',
    id: uuidv4()
  };

  const mockIngredient: TConstructorIngredient = {
    _id: 'ing1',
    name: 'Ingredient1',
    type: 'sauce',
    proteins: 5,
    fat: 5,
    carbohydrates: 5,
    calories: 50,
    price: 50,
    image: 'image1.png',
    image_mobile: 'image1-mobile.png',
    image_large: 'image1-large.png',
    id: uuidv4()
  };

  const initialState = {
    constructorItems: {
      bun: null,
      ingredients: []
    }
  };

  test('initial state', () => {
    expect(builderSlice(undefined, { type: '' })).toEqual(initialState);
  });

  describe('addBunBuilder', () => {
    test('adds bun to empty state', () => {
      const state = builderSlice(initialState, addBunBuilder(mockBun));
      expect(state.constructorItems.bun).toEqual(mockBun);
      expect(state.constructorItems.ingredients).toEqual([]);
    });

    test('replaces existing bun', () => {
      const newBun = { ...mockBun, _id: 'bun2', name: 'New Bun' };
      const state = builderSlice(
        { constructorItems: { bun: mockBun, ingredients: [] } },
        addBunBuilder(newBun)
      );
      expect(state.constructorItems.bun).toEqual(newBun);
    });

    test('clears bun when null payload', () => {
      const state = builderSlice(
        { constructorItems: { bun: mockBun, ingredients: [] } },
        addBunBuilder(null)
      );
      expect(state.constructorItems.bun).toBeNull();
    });
  });

  describe('addItemBuilder', () => {
    test('adds ingredient to constructor', () => {
      const action = addItemBuilder(mockIngredient);
      const state = builderSlice(initialState, action);
      
      expect(state.constructorItems.ingredients).toHaveLength(1);
      expect(state.constructorItems.ingredients[0]).toMatchObject({
        _id: 'ing1',
        name: 'Ingredient1'
      });
      expect(state.constructorItems.ingredients[0].id).toBeDefined();
    });

    test('handles bun addition correctly', () => {
      const bunWithId = { ...mockBun, id: uuidv4() };
      const action = addItemBuilder(bunWithId);
      const state = builderSlice(initialState, action);
      
      expect(state.constructorItems.bun).toMatchObject({
        _id: 'bun1',
        name: 'Bun1'
      });
      expect(state.constructorItems.ingredients).toEqual([]);
    });
  });

  describe('deleteItemBuilder', () => {
    const stateWithItems = {
      constructorItems: {
        bun: mockBun,
        ingredients: [
          { ...mockIngredient, id: '1' },
          { ...mockIngredient, id: '2' }
        ]
      }
    };

    test('deletes ingredient by id', () => {
      const action = deleteItemBuilder({ id: '1', type: 'sauce' });
      const state = builderSlice(stateWithItems, action);
      
      expect(state.constructorItems.ingredients).toHaveLength(1);
      expect(state.constructorItems.ingredients[0].id).toBe('2');
    });

    test('ignores bun deletion attempt', () => {
      const action = deleteItemBuilder({ id: 'bun1', type: 'bun' });
      const state = builderSlice(stateWithItems, action);
      
      expect(state.constructorItems.bun).toEqual(mockBun);
      expect(state.constructorItems.ingredients).toHaveLength(2);
    });
  });

  describe('moveItems', () => {
    const ingredients = [
      { ...mockIngredient, id: '1' },
      { ...mockIngredient, id: '2' },
      { ...mockIngredient, id: '3' }
    ];

    const stateWithIngredients = {
      constructorItems: {
        bun: mockBun,
        ingredients
      }
    };

    test('moves item up', () => {
      const action = moveItems({ index: 1, direction: 'up' });
      const state = builderSlice(stateWithIngredients, action);
      
      expect(state.constructorItems.ingredients[0].id).toBe('2');
      expect(state.constructorItems.ingredients[1].id).toBe('1');
    });

    test('moves item down', () => {
      const action = moveItems({ index: 1, direction: 'down' });
      const state = builderSlice(stateWithIngredients, action);
      
      expect(state.constructorItems.ingredients[1].id).toBe('3');
      expect(state.constructorItems.ingredients[2].id).toBe('2');
    });

    test('does nothing when moving first item up', () => {
      const action = moveItems({ index: 0, direction: 'up' });
      const state = builderSlice(stateWithIngredients, action);
      expect(state.constructorItems.ingredients).toEqual(ingredients);
    });

    test('does nothing when moving last item down', () => {
      const action = moveItems({ index: 2, direction: 'down' });
      const state = builderSlice(stateWithIngredients, action);
      expect(state.constructorItems.ingredients).toEqual(ingredients);
    });
  });

  describe('clearBuilder', () => {
    test('resets to initial state', () => {
      const state = builderSlice(
        {
          constructorItems: {
            bun: mockBun,
            ingredients: [mockIngredient, mockIngredient]
          }
        },
        clearBuilder()
      );
      
      expect(state).toEqual(initialState);
    });
  });

  describe('selectors', () => {
    const testState = {
      builder: {
        constructorItems: {
          bun: mockBun,
          ingredients: [mockIngredient, mockIngredient]
        }
      }
    };

    test('selectConstructorItems returns all items', () => {
      expect(selectConstructorItems(testState as any)).toEqual({
        bun: mockBun,
        ingredients: [mockIngredient, mockIngredient]
      });
    });

    test('selectBun returns bun', () => {
      expect(selectBun(testState as any)).toBe(mockBun);
    });

    test('selectConstructorTotalCount returns ingredients count', () => {
      expect(selectConstructorTotalCount(testState as any)).toBe(2);
    });
  });
});