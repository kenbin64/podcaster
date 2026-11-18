# AI video (local, free, the heavy frontier)

The studio's **AI video** panel does image-to-video (animate a still) and text-to-video (a clip from a
prompt), entirely on your machine. Honest expectations: this is the hardest, most demanding part of
generative media. It needs a strong NVIDIA GPU (ideally 12 GB+ VRAM), clips are short (a few seconds),
and quality varies. It's free and private, but it is not yet drop-in "pro footage."

## The local backend: ComfyUI + LTX-Video

There is no single standard local video API, so the de-facto runner is **ComfyUI** (free, open source),
driving an open video model. The best free pick for speed and license is **LTX-Video** (Apache-2.0);
CogVideoX and Stable Video Diffusion also work.

1. Install **ComfyUI**: <https://github.com/comfyanonymous/ComfyUI> (it has a portable Windows build).
2. Add the **LTX-Video** model + nodes (ComfyUI Manager makes this easy), or CogVideoX.
3. Launch ComfyUI (default port **8188**). The studio's AI video panel will detect it.

## Status of the wiring

- **Detection** is live: the panel polls ComfyUI on 8188 and tells you if it's up.
- **Styles** (Real life, CGI, Pixar, Cartoon, 2D, 3D, Pseudo-3D) are applied to the prompt, the same
  ones the image panel uses.
- **Generation** is the honest gap: ComfyUI runs *workflows* (node graphs), not a one-call REST endpoint.
  The studio is wired to hand your prompt (and source image for image-to-video) to ComfyUI; finishing it
  means dropping in an LTX-Video workflow and mapping the prompt/image into it. That last step is done
  per setup, so once you have ComfyUI + LTX running, the wiring gets completed against your workflow.

If you'd rather not run video locally yet, skip it: voiceover, images, and the adaptive score don't need
any of this.
