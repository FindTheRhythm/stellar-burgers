import builderReducer from '../builder-slice';
import feedReducer from '../feed-slice';
import ingredientsReducer from '../ingredients-slice';
import orderReducer from '../order-slice';
import userReducer from '../user-slice';

const rootReducer = {
  builder: builderReducer,
  feed: feedReducer,
  ingredients: ingredientsReducer,
  order: orderReducer,
  user: userReducer
};

function combinedReducer(state: any, action: any) {
  return Object.keys(rootReducer).reduce((acc, key) => {
    // @ts-ignore
    acc[key] = rootReducer[key](state?.[key], action);
    return acc;
  }, {} as any);
}

describe('rootReducer', () => {
  it('возвращает начальное состояние при неизвестном экшене', () => {
    const state = combinedReducer(undefined, { type: 'UNKNOWN_ACTION' });
    expect(state).toEqual({
      builder: builderReducer(undefined, { type: '' }),
      feed: feedReducer(undefined, { type: '' }),
      ingredients: ingredientsReducer(undefined, { type: '' }),
      order: orderReducer(undefined, { type: '' }),
      user: userReducer(undefined, { type: '' })
    });
  });
}); 