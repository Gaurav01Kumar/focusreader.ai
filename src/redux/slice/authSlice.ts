import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  userData: Record<string, any> | null;
}

const initialState: AuthState = {
  userData: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, action: PayloadAction<Record<string, any>>) {
      state.userData = action.payload;
    },
    logout(state) {
      state.userData = null;
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
