import { put, call } from "redux-saga/effects";
import { delay } from "redux-saga";
import * as actions from "../actions/index";
import axios from "axios";

export function* logoutSaga(action) {
  yield call([localStorage, "removeItem"], "token");
  yield call([localStorage, "removeItem"], "expirationDate");
  yield call([localStorage, "removeItem"], "userId");
  yield put(actions.logoutSucceed());
}

export function* checkAuthTimeoutSaga(action) {
  yield delay(action.expirationTime * 1000);
  yield put(actions.logout());
}

export function* authUserSaga(action) {
  yield put(actions.authStart());
  const authData = {
    email: action.email,
    password: action.password,
    returnSecureToken: true
  };
  let url =
    "https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=AIzaSyCwRA6g5SJjBKrXIBT2ASt2P2At4rBDk_Y";
  if (!action.isSignup) {
    url =
      "https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=AIzaSyCwRA6g5SJjBKrXIBT2ASt2P2At4rBDk_Y";
  }
  try {
    const response = yield axios.post(url, authData);
    const expirationDate = yield new Date(
      new Date().getTime() + response.data.expiresIn * 1000
    );
    yield call([localStorage, "setItem"], "token", response.data.idToken);
    yield call([localStorage, "setItem"], "expirationDate", expirationDate);
    yield call([localStorage, "setItem"], "userId", response.data.localId);
    yield put(actions.authSuccess());
    yield put(actions.checkAuthTimeout());
  } catch (err) {
    yield put(actions.authFail());
  }
}

export function* authCheckStateSaga(action) {
  const token = yield call([localStorage, "getItem"], "token");
  if (!token) {
    yield put(actions.logout());
  } else {
    const expirationDate = yield new Date(
      localStorage.getItem("expirationDate")
    );
    if (expirationDate <= new Date()) {
      yield put(actions.logout());
    } else {
      const userId = yield call([localStorage,'getItem'], "userId");
      yield put(actions.authSuccess(token, userId));
      yield put(
        actions.checkAuthTimeout(
          (expirationDate.getTime() - new Date().getTime()) / 1000
        )
      );
    }
  }
}
