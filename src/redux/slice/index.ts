import { Reducer } from "@reduxjs/toolkit";
import profileReducer from "./profile";
import projectReducer from "./project";
import shapesReducer from "./shapes";
import viewportReducer from "./viewport";
import chatReducer from "./chat";

export const slices: Record<string, Reducer> = {
    profile: profileReducer,
    projects: projectReducer,
    shapes: shapesReducer,
    viewport: viewportReducer,
    chat: chatReducer
}