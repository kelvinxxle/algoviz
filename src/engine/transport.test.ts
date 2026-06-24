import { describe, it, expect } from "vitest";
import {
  SPEEDS,
  initialTransportState,
  transportReducer,
  type TransportState,
} from "./transport";

function load(stepCount: number): TransportState {
  return transportReducer(initialTransportState, {
    type: "load",
    stepCount,
  });
}

describe("transportReducer", () => {
  it("starts empty and paused", () => {
    expect(initialTransportState).toEqual({
      stepCount: 0,
      index: 0,
      playing: false,
      speed: 1,
    });
  });

  it("load resets index to 0, pauses, and records the count", () => {
    const playing = { ...load(5), index: 3, playing: true };
    const next = transportReducer(playing, { type: "load", stepCount: 8 });
    expect(next).toMatchObject({ stepCount: 8, index: 0, playing: false });
  });

  it("next advances and clamps at the last index", () => {
    let s = load(3);
    s = transportReducer(s, { type: "next" });
    expect(s.index).toBe(1);
    s = transportReducer(s, { type: "next" });
    s = transportReducer(s, { type: "next" });
    expect(s.index).toBe(2);
  });

  it("prev steps back and clamps at zero, pausing", () => {
    let s = { ...load(3), index: 1, playing: true };
    s = transportReducer(s, { type: "prev" });
    expect(s).toMatchObject({ index: 0, playing: false });
    s = transportReducer(s, { type: "prev" });
    expect(s.index).toBe(0);
  });

  it("next pauses playback", () => {
    const s = transportReducer({ ...load(3), playing: true }, { type: "next" });
    expect(s.playing).toBe(false);
  });

  it("play and pause toggle the playing flag", () => {
    const playing = transportReducer(load(3), { type: "play" });
    expect(playing.playing).toBe(true);
    const paused = transportReducer(playing, { type: "pause" });
    expect(paused.playing).toBe(false);
  });

  it("play on an empty sequence is a no-op and never starts playing", () => {
    const s = transportReducer(load(0), { type: "play" });
    expect(s.playing).toBe(false);
    expect(s.index).toBe(0);
  });

  it("play at the last step restarts from the beginning", () => {
    const atEnd = { ...load(3), index: 2 };
    const s = transportReducer(atEnd, { type: "play" });
    expect(s).toMatchObject({ index: 0, playing: true });
  });

  it("toggle flips playing", () => {
    const a = transportReducer(load(3), { type: "toggle" });
    expect(a.playing).toBe(true);
    const b = transportReducer(a, { type: "toggle" });
    expect(b.playing).toBe(false);
  });

  it("seek clamps within range and pauses", () => {
    let s = { ...load(5), playing: true };
    s = transportReducer(s, { type: "seek", index: 3 });
    expect(s).toMatchObject({ index: 3, playing: false });
    s = transportReducer(s, { type: "seek", index: 99 });
    expect(s.index).toBe(4);
    s = transportReducer(s, { type: "seek", index: -2 });
    expect(s.index).toBe(0);
  });

  it("tick advances during playback", () => {
    const s = transportReducer({ ...load(3), playing: true }, { type: "tick" });
    expect(s.index).toBe(1);
    expect(s.playing).toBe(true);
  });

  it("tick at the final step stops playback and holds the last index", () => {
    const atEnd = { ...load(3), index: 2, playing: true };
    const s = transportReducer(atEnd, { type: "tick" });
    expect(s).toMatchObject({ index: 2, playing: false });
  });

  it("tick while paused is a no-op", () => {
    const paused = { ...load(3), index: 1, playing: false };
    expect(transportReducer(paused, { type: "tick" })).toEqual(paused);
  });

  it("setSpeed accepts allowed speeds and ignores others", () => {
    const s = transportReducer(load(3), { type: "setSpeed", speed: 2 });
    expect(s.speed).toBe(2);
    const ignored = transportReducer(s, { type: "setSpeed", speed: 7 });
    expect(ignored.speed).toBe(2);
  });

  it("reset returns to index 0 paused without losing the count", () => {
    const s = transportReducer(
      { ...load(5), index: 4, playing: true },
      { type: "reset" }
    );
    expect(s).toMatchObject({ stepCount: 5, index: 0, playing: false });
  });

  it("exposes a sane set of speeds", () => {
    expect(SPEEDS).toContain(1);
    expect([...SPEEDS].every((n) => n > 0)).toBe(true);
  });

  it("never advances past an empty sequence", () => {
    let s = load(0);
    s = transportReducer(s, { type: "next" });
    expect(s.index).toBe(0);
    s = transportReducer(s, { type: "play" });
    s = transportReducer(s, { type: "tick" });
    expect(s.index).toBe(0);
  });
});
