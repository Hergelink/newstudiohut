import { describe, expect, it, vi } from "vitest";
import {
  saveDraftWithPhotos,
  type DraftUploadSession,
} from "@/modules/media/draft-upload";

const jpeg = () =>
  new File(
    [new Uint8Array([0xff, 0xd8, 0xff, ...Array(20).fill(0)])],
    "studio.jpg",
    { type: "image/jpeg" },
  );
const photos = () => ["cover", "room"].map((id) => ({ id, file: jpeg() }));
const session = (): DraftUploadSession => ({
  tickets: new Map(),
  completed: new Set(),
});
function actions() {
  let index = 0;
  return {
    create: vi.fn(async () => ({ ok: true, listingId: "new-studio" })),
    prepare: vi.fn(async () => ({
      ok: true,
      path: `photo-${++index}`,
      token: "signed-token",
    })),
    upload: vi.fn(async (_path: string, _token: string, _file: File) => {
      void _path;
      void _token;
      void _file;
    }),
    complete: vi.fn(async () => ({ ok: true })),
  };
}

describe("photos selected while creating a studio", () => {
  it("creates once, sends only text through the action, and uploads in the chosen order", async () => {
    const deps = actions();
    const state = session();
    const data = new FormData();
    data.set("name", "Studio");
    data.set("image", jpeg());
    const progress = vi.fn();
    expect(
      await saveDraftWithPhotos(deps, state, photos(), data, progress),
    ).toEqual({ ok: true });
    expect(deps.create).toHaveBeenCalledTimes(1);
    expect(data.has("image")).toBe(false);
    expect(data.get("name")).toBe("Studio");
    expect(deps.upload.mock.calls.map((call) => call[0])).toEqual([
      "photo-1",
      "photo-2",
    ]);
    expect(state.completed).toEqual(new Set(["cover", "room"]));
    expect(progress).toHaveBeenLastCalledWith({
      listingId: "new-studio",
      completed: 2,
      total: 2,
    });
  });

  it("rejects sixteen photos and spoofed image bytes before creating a draft", async () => {
    const deps = actions();
    expect(
      await saveDraftWithPhotos(
        deps,
        session(),
        Array.from({ length: 16 }, (_, i) => ({ id: String(i), file: jpeg() })),
        new FormData(),
        vi.fn(),
      ),
    ).toEqual({ ok: false, message: "image_limit" });
    expect(
      await saveDraftWithPhotos(
        deps,
        session(),
        [
          {
            id: "bad",
            file: new File([new Uint8Array(24)], "fake.jpg", {
              type: "image/jpeg",
            }),
          },
        ],
        new FormData(),
        vi.fn(),
      ),
    ).toEqual({ ok: false, message: "image_signature_invalid" });
    expect(deps.create).not.toHaveBeenCalled();
  });

  it("retries remaining files without creating another draft or reuploading completed photos", async () => {
    const deps = actions();
    deps.upload
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("offline"));
    const state = session();
    const selection = photos();
    expect(
      (
        await saveDraftWithPhotos(
          deps,
          state,
          selection,
          new FormData(),
          vi.fn(),
        )
      ).ok,
    ).toBe(false);
    expect(state.completed).toEqual(new Set(["cover"]));
    expect(
      await saveDraftWithPhotos(
        deps,
        state,
        selection,
        new FormData(),
        vi.fn(),
      ),
    ).toEqual({ ok: true });
    expect(deps.create).toHaveBeenCalledTimes(1);
    expect(deps.prepare).toHaveBeenCalledTimes(2);
    expect(deps.upload).toHaveBeenCalledTimes(3);
    expect(state.completed.size).toBe(2);
  });

  it("retries finalization with the same path when the response is interrupted", async () => {
    const deps = actions();
    deps.complete.mockRejectedValueOnce(new Error("response lost"));
    const state = session();
    const selection = photos().slice(0, 1);
    await saveDraftWithPhotos(deps, state, selection, new FormData(), vi.fn());
    expect(
      await saveDraftWithPhotos(
        deps,
        state,
        selection,
        new FormData(),
        vi.fn(),
      ),
    ).toEqual({ ok: true });
    expect(deps.upload).toHaveBeenCalledTimes(1);
    expect(deps.prepare).toHaveBeenCalledTimes(1);
    expect(deps.complete).toHaveBeenCalledTimes(2);
    expect(deps.create).toHaveBeenCalledTimes(1);
  });

  it("does not upload when draft validation fails", async () => {
    const deps = {
      ...actions(),
      create: vi.fn(async () => ({
        ok: false,
        message: "validation_error",
        fieldErrors: { name: ["required"] },
      })),
    };
    const result = await saveDraftWithPhotos(
      deps,
      session(),
      photos(),
      new FormData(),
      vi.fn(),
    );
    expect(result.message).toBe("validation_error");
    expect(deps.prepare).not.toHaveBeenCalled();
  });
});
