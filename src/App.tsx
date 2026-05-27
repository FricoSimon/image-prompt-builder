import { useMemo, useState } from "react"
import {
  ArrowLeftIcon,
  BookOpenIcon,
  BracesIcon,
  CheckIcon,
  ClipboardIcon,
  InfoIcon,
  PlusIcon,
  RefreshCcwIcon,
  SparklesIcon,
  Trash2Icon,
  UserRoundIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const defaults = {
  style: "Realistic Polaroid-style candid instant photo",
  imageSize: "9:16 vertical story",
  orientation: "portrait",
  resolution: "1080p",
  camera: "ordinary instant-camera snapshot",
  framing: "medium shot",
  angle: "eye-level",
  subjects: [
    {
      id: "subject-1",
      identity: "girl from reference image",
      pose: "standing close to the boy in a cute casual pose",
      expression: "natural, playful, candid",
      prop: "holding a burger",
    },
    {
      id: "subject-2",
      identity: "boy from reference image",
      pose: "relaxed, standing next to the girl",
      expression: "natural, playful, candid",
      prop: "holding a red Coca-Cola can",
    },
  ],
  location: "indoor room",
  background: "plain white curtains",
  mood: "cute, nostalgic, intimate, natural",
  lighting: "single direct on-camera flash in a dim room",
  colorGrading: "warm nostalgic film tones",
  effects:
    "soft focus, slight motion blur, subtle film grain, flash-lit shadows, minor exposure falloff",
  identityConstraints:
    "preserve both people's facial features, proportions, and expressions exactly from the references; do not beautify, distort, or change their faces; keep both people recognizable",
  negativeConstraints:
    "no studio look, no dramatic posing, no text, no watermark, no artificial glossy look, no distorted faces or hands",
}

const fieldHelp = {
  style:
    "Overall rendering target, such as photorealistic, Polaroid, cinematic, or illustration.",
  imageSize:
    "Aspect ratio or format shape, such as square, portrait, story, or widescreen.",
  orientation:
    "Image direction intent: portrait, landscape, square, or automatic.",
  resolution: "Output quality target, separate from aspect ratio.",
  camera:
    "What device, lens, or photographic behavior the image should feel like.",
  framing: "How much of the subject or scene appears in the image.",
  angle: "The camera viewpoint relative to the subject or scene.",
  colorGrading:
    "Final color treatment, such as warm film tones or cool cinematic tones.",
  subjects:
    "People, objects, animals, or characters that should appear in the image.",
  location: "Where the scene takes place.",
  background: "What appears behind or around the subject.",
  lighting:
    "How the scene is lit, such as flash, window light, or studio light.",
  mood: "The emotional feeling or vibe the image should communicate.",
  effects:
    "Optical, film, or rendering details like grain, blur, shadows, or soft focus.",
  identityConstraints:
    "Rules for preserving reference faces, proportions, expressions, or recognizable traits.",
  negativeConstraints: "Things the image model should avoid generating.",
  subjectIdentity: "Who or what this subject is.",
  subjectPose: "What this subject is doing or how they are positioned.",
  subjectExpression:
    "The subject's facial expression or emotional presentation.",
  subjectProp: "An object the subject holds, wears, uses, or interacts with.",
}

type PromptForm = typeof defaults

type Subject = PromptForm["subjects"][number]

type AppView = "composer" | "library"

type TextFieldKey = {
  [Key in keyof PromptForm]: PromptForm[Key] extends string ? Key : never
}[keyof PromptForm]

type SubjectTextKey = Exclude<keyof Subject, "id">

type LibraryTarget =
  | {
      kind: "field"
      field: TextFieldKey
      label: string
    }
  | {
      kind: "subject"
      subjectId: string
      subjectLegend: string
      field: SubjectTextKey
      label: string
    }

type FieldKeywordCategory = {
  id: string
  kind: "field"
  field: TextFieldKey
  label: string
  description: string
  keywords: string[]
  separator?: string
}

type SubjectKeywordCategory = {
  id: string
  kind: "subject"
  field: SubjectTextKey
  label: string
  description: string
  keywords: string[]
  separator?: string
}

type KeywordCategory = FieldKeywordCategory | SubjectKeywordCategory

type KeywordMode = "replace" | "append"

type StructuredPrompt = {
  type: "image_generation_prompt"
  style: string
  image_size: string
  orientation: string
  resolution: string
  color_grading: string
  camera_style: {
    camera: string
    framing: string
    angle: string
    effects: string[]
  }
  subjects: Array<{
    id: string
    identity: string
    pose: string
    expression: string
    prop: string
  }>
  environment: {
    location: string
    background: string
    lighting: string
  }
  mood: string
  identity_constraints: string[]
  negative_constraints: string[]
}

const keywordCategories: KeywordCategory[] = [
  {
    id: "style",
    kind: "field",
    field: "style",
    label: "Style",
    description: "Rendering style",
    keywords: [
      "photorealistic photography",
      "cinematic editorial photography",
      "clean product photography",
      "cozy lifestyle photography",
      "soft watercolor illustration",
      "high-detail anime key visual",
      "hyperrealistic cinematic photography",
      "realistic Polaroid-style candid instant photo",
    ],
  },
  {
    id: "imageSize",
    kind: "field",
    field: "imageSize",
    label: "Image size",
    description: "Aspect ratio",
    keywords: [
      "1:1 square",
      "4:5 portrait",
      "9:16 vertical story",
      "16:9 widescreen",
      "3:2 landscape",
      "2:3 portrait",
    ],
  },
  {
    id: "orientation",
    kind: "field",
    field: "orientation",
    label: "Orientation",
    description: "Canvas direction",
    keywords: ["portrait", "landscape", "square", "auto"],
  },
  {
    id: "resolution",
    kind: "field",
    field: "resolution",
    label: "Resolution",
    description: "Output target",
    keywords: ["1080p", "2K", "4K", "8K", "high resolution"],
  },
  {
    id: "camera",
    kind: "field",
    field: "camera",
    label: "Camera look",
    description: "Device or lens behavior",
    keywords: [
      "ordinary instant-camera snapshot",
      "35mm film camera portrait",
      "phone camera candid photo",
      "studio camera product shot",
      "wide-angle documentary photo",
      "macro product lens",
      "shallow depth-of-field portrait lens",
    ],
  },
  {
    id: "framing",
    kind: "field",
    field: "framing",
    label: "Framing",
    description: "Subject coverage",
    keywords: [
      "medium shot",
      "close-up portrait",
      "full-body shot",
      "wide establishing shot",
      "over-the-shoulder shot",
      "tight crop",
    ],
  },
  {
    id: "angle",
    kind: "field",
    field: "angle",
    label: "Angle",
    description: "Camera viewpoint",
    keywords: [
      "eye-level",
      "slightly low angle",
      "slightly high angle",
      "top-down",
      "three-quarter angle",
      "straight-on",
    ],
  },
  {
    id: "colorGrading",
    kind: "field",
    field: "colorGrading",
    label: "Color grading",
    description: "Color finish",
    keywords: [
      "warm nostalgic film tones",
      "natural neutral color",
      "cool cinematic tones",
      "soft pastel color grade",
      "high-contrast editorial grade",
      "muted vintage color grade",
    ],
  },
  {
    id: "subjectIdentity",
    kind: "subject",
    field: "identity",
    label: "Subject identity",
    description: "Who or what appears",
    keywords: [
      "person from reference image",
      "girl from reference image",
      "boy from reference image",
      "main product",
      "brand mascot",
      "background character",
    ],
  },
  {
    id: "subjectPose",
    kind: "subject",
    field: "pose",
    label: "Subject pose",
    description: "Body position or action",
    keywords: [
      "standing naturally",
      "relaxed seated pose",
      "walking toward camera",
      "looking over shoulder",
      "holding the product clearly",
      "leaning casually",
      "mid-laugh candid moment",
    ],
  },
  {
    id: "subjectExpression",
    kind: "subject",
    field: "expression",
    label: "Subject expression",
    description: "Face or emotion",
    keywords: [
      "natural, playful, candid",
      "soft smile",
      "confident expression",
      "serious editorial expression",
      "warm and approachable",
      "surprised but natural",
    ],
  },
  {
    id: "subjectProp",
    kind: "subject",
    field: "prop",
    label: "Subject prop",
    description: "Held or used object",
    keywords: [
      "holding a burger",
      "holding a red Coca-Cola can",
      "wearing headphones",
      "holding a phone",
      "carrying a tote bag",
      "interacting with the product",
    ],
  },
  {
    id: "location",
    kind: "field",
    field: "location",
    label: "Location",
    description: "Scene place",
    keywords: [
      "indoor room",
      "small cafe",
      "modern kitchen",
      "city sidewalk",
      "studio backdrop",
      "cozy bedroom",
      "sunlit office",
    ],
  },
  {
    id: "background",
    kind: "field",
    field: "background",
    label: "Background",
    description: "Surrounding detail",
    keywords: [
      "plain white curtains",
      "soft blurred city lights",
      "minimal neutral backdrop",
      "warm home interior",
      "clean studio sweep",
      "busy street background",
    ],
  },
  {
    id: "lighting",
    kind: "field",
    field: "lighting",
    label: "Lighting",
    description: "Light quality",
    keywords: [
      "single direct on-camera flash in a dim room",
      "soft natural window light",
      "warm lamp light",
      "dramatic cinematic side light",
      "clean studio softbox lighting",
      "golden-hour sunlight",
    ],
  },
  {
    id: "mood",
    kind: "field",
    field: "mood",
    label: "Mood",
    description: "Emotional tone",
    keywords: [
      "cute",
      "nostalgic",
      "intimate",
      "natural",
      "premium",
      "playful",
      "surreal",
      "cozy",
    ],
  },
  {
    id: "effects",
    kind: "field",
    field: "effects",
    label: "Visual effects",
    description: "Optical texture",
    keywords: [
      "soft focus",
      "slight motion blur",
      "subtle film grain",
      "flash-lit shadows",
      "minor exposure falloff",
      "shallow depth of field",
      "gentle lens bloom",
    ],
  },
  {
    id: "identityConstraints",
    kind: "field",
    field: "identityConstraints",
    label: "Identity constraints",
    description: "Reference preservation",
    separator: "; ",
    keywords: [
      "preserve facial features from the reference",
      "keep proportions accurate",
      "keep the person recognizable",
      "do not beautify the face",
      "do not change expression",
      "preserve hairstyle and face shape",
    ],
  },
  {
    id: "negativeConstraints",
    kind: "field",
    field: "negativeConstraints",
    label: "Negative constraints",
    description: "Avoid list",
    keywords: [
      "no text",
      "no watermark",
      "no distorted faces",
      "no distorted hands",
      "no artificial glossy look",
      "no studio look",
      "no dramatic posing",
    ],
  },
]

function splitList(value: string) {
  return value
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function splitRules(value: string) {
  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
}

function withArticle(phrase: string) {
  const trimmed = phrase.trim()

  if (/^(a|an|the)\s/i.test(trimmed)) {
    return trimmed
  }

  return /^[aeiou]/i.test(trimmed) ? `an ${trimmed}` : `a ${trimmed}`
}

function listToSentence(items: string[]) {
  if (!items.length) {
    return ""
  }

  if (items.length === 1) {
    return items[0]
  }

  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`
}

function appendKeywordValue(value: string, keyword: string, separator = ", ") {
  const trimmed = value.trim()

  if (!trimmed) {
    return keyword
  }

  if (
    trimmed
      .split(/[;,]/)
      .map((item) => item.trim().toLowerCase())
      .includes(keyword.toLowerCase())
  ) {
    return trimmed
  }

  return `${trimmed}${separator}${keyword}`
}

function isCategoryActive(
  category: KeywordCategory,
  target: LibraryTarget | null
) {
  if (!target || category.kind !== target.kind) {
    return false
  }

  return category.field === target.field
}

function toStructuredPrompt(form: PromptForm): StructuredPrompt {
  return {
    type: "image_generation_prompt",
    style: form.style,
    image_size: form.imageSize,
    orientation: form.orientation,
    resolution: form.resolution,
    color_grading: form.colorGrading,
    camera_style: {
      camera: form.camera,
      framing: form.framing,
      angle: form.angle,
      effects: splitList(form.effects),
    },
    subjects: form.subjects.map((subject) => ({
      id: subject.id,
      identity: subject.identity,
      pose: subject.pose,
      expression: subject.expression,
      prop: subject.prop,
    })),
    environment: {
      location: form.location,
      background: form.background,
      lighting: form.lighting,
    },
    mood: form.mood,
    identity_constraints: splitRules(form.identityConstraints),
    negative_constraints: splitList(form.negativeConstraints),
  }
}

function buildNaturalPrompt(config: StructuredPrompt) {
  const effects = listToSentence(config.camera_style.effects)
  const identityRules = config.identity_constraints.join(". ")
  const negativeRules = config.negative_constraints.join(", ")
  const subjectNames = config.subjects.map((subject) => subject.identity)
  const subjectOverview = subjectNames.length
    ? `of ${listToSentence(subjectNames)}`
    : "of the requested scene"
  const subjectDetails = config.subjects.length
    ? config.subjects
        .map((subject) => {
          const details = [
            subject.pose,
            subject.prop,
            `with a ${subject.expression} expression`,
          ].filter(Boolean)

          return `${subject.identity} is ${details.join(", ")}.`
        })
        .join(" ")
    : "There are no specific subjects; focus on the environment, lighting, composition, and overall mood."
  const promptParts = [
    `Create ${withArticle(config.style)} ${subjectOverview} in ${withArticle(config.environment.location)}, with ${config.environment.background} as the background.`,
    subjectDetails,
    `Use ${config.orientation} orientation with a ${config.image_size} image size/aspect ratio at ${config.resolution} resolution.`,
    `Frame the image as a ${config.camera_style.framing} from an ${config.camera_style.angle} angle, with the look of an ${config.camera_style.camera}. Use ${config.environment.lighting}.`,
    `The image should feel ${config.mood}, with ${config.color_grading}.${effects ? ` Include ${effects}.` : ""}`,
  ]

  if (config.subjects.length && identityRules) {
    promptParts.push(`Preserve identity: ${identityRules}.`)
  }

  if (negativeRules) {
    promptParts.push(`Avoid: ${negativeRules}.`)
  }

  return promptParts.join("\n\n")
}

function App() {
  const [form, setForm] = useState<PromptForm>(defaults)
  const [submitted, setSubmitted] = useState<PromptForm>(defaults)
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle")
  const [activeView, setActiveView] = useState<AppView>("composer")
  const [activeLibraryTarget, setActiveLibraryTarget] =
    useState<LibraryTarget | null>(null)

  const draftConfig = useMemo(() => toStructuredPrompt(form), [form])
  const outputConfig = useMemo(() => toStructuredPrompt(submitted), [submitted])
  const naturalPrompt = useMemo(
    () => buildNaturalPrompt(outputConfig),
    [outputConfig]
  )
  const jsonPreview = useMemo(
    () => JSON.stringify(outputConfig, null, 2),
    [outputConfig]
  )

  function updateField<K extends keyof PromptForm>(
    key: K,
    value: PromptForm[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function openLibrary(target?: LibraryTarget) {
    if (target) {
      setActiveLibraryTarget(target)
    }

    setActiveView("library")
  }

  function applyKeyword(
    category: KeywordCategory,
    keyword: string,
    mode: KeywordMode
  ) {
    const nextValue = (currentValue: string) =>
      mode === "replace"
        ? keyword
        : appendKeywordValue(currentValue, keyword, category.separator)

    setForm((current) => {
      if (category.kind === "field") {
        return {
          ...current,
          [category.field]: nextValue(current[category.field]),
        }
      }

      const targetSubjectId =
        activeLibraryTarget?.kind === "subject" &&
        activeLibraryTarget.field === category.field
          ? activeLibraryTarget.subjectId
          : current.subjects[0]?.id

      if (!targetSubjectId) {
        return {
          ...current,
          subjects: [
            {
              id: `subject-${Date.now()}-${Math.round(Math.random() * 10000)}`,
              identity:
                category.field === "identity" ? keyword : "subject 1",
              pose:
                category.field === "pose" ? keyword : "natural, relaxed pose",
              expression:
                category.field === "expression" ? keyword : "natural, candid",
              prop: category.field === "prop" ? keyword : "",
            },
          ],
        }
      }

      return {
        ...current,
        subjects: current.subjects.map((subject) =>
          subject.id === targetSubjectId
            ? {
                ...subject,
                [category.field]: nextValue(subject[category.field]),
              }
            : subject
        ),
      }
    })
  }

  function addSubject() {
    setForm((current) => {
      const nextIndex = current.subjects.length + 1

      return {
        ...current,
        subjects: [
          ...current.subjects,
          {
            id: `subject-${Date.now()}-${Math.round(Math.random() * 10000)}`,
            identity: `subject ${nextIndex}`,
            pose: "natural, relaxed pose",
            expression: "natural, candid",
            prop: "",
          },
        ],
      }
    })
  }

  function removeSubject(id: string) {
    setForm((current) => ({
      ...current,
      subjects: current.subjects.filter((subject) => subject.id !== id),
    }))
  }

  function updateSubject<K extends keyof Omit<Subject, "id">>(
    id: string,
    key: K,
    value: Subject[K]
  ) {
    setForm((current) => ({
      ...current,
      subjects: current.subjects.map((subject) =>
        subject.id === id ? { ...subject, [key]: value } : subject
      ),
    }))
  }

  function resetForm() {
    setForm(defaults)
    setSubmitted(defaults)
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(naturalPrompt)
    } catch {
      const element = document.createElement("textarea")
      element.value = naturalPrompt
      element.setAttribute("readonly", "")
      element.style.position = "fixed"
      element.style.opacity = "0"
      document.body.appendChild(element)
      element.select()
      document.execCommand("copy")
      document.body.removeChild(element)
    }

    setCopyState("copied")
    window.setTimeout(() => setCopyState("idle"), 1200)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(form)
  }

  return (
    <main className="app-surface min-h-svh">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 md:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-primary/15 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-3xl flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                <BracesIcon data-icon="inline-start" />
                JSON to prompt
              </Badge>
              <Badge variant="outline">Light mode</Badge>
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                {activeView === "composer"
                  ? "Prompt Composer"
                  : "Keyword Library"}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                {activeView === "composer"
                  ? "Maintain image-generation details as structured values, then submit them into a clean natural-language prompt."
                  : "Browse reusable prompt language by field and send useful phrases back into the composer."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={activeView === "composer" ? "default" : "outline"}
              onClick={() => setActiveView("composer")}
            >
              <SparklesIcon data-icon="inline-start" />
              Composer
            </Button>
            <Button
              type="button"
              variant={activeView === "library" ? "default" : "outline"}
              onClick={() => openLibrary()}
            >
              <BookOpenIcon data-icon="inline-start" />
              Library
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              <RefreshCcwIcon data-icon="inline-start" />
              Reset
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" onClick={copyPrompt}>
                  {copyState === "copied" ? (
                    <CheckIcon data-icon="inline-start" />
                  ) : (
                    <ClipboardIcon data-icon="inline-start" />
                  )}
                  {copyState === "copied" ? "Copied" : "Copy prompt"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy the generated natural prompt</TooltipContent>
            </Tooltip>
          </div>
        </header>

        {activeView === "composer" ? (
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(420px,0.88fr)]">
            <Card className="bg-card/95 shadow-sm">
            <CardHeader>
              <CardTitle>Image Details</CardTitle>
              <CardDescription>
                Enter exact image details as editable text so they survive the
                conversion.
              </CardDescription>
              <CardAction>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {draftConfig.subjects.length} subjects
                  </Badge>
                  <Badge variant="outline">
                    {draftConfig.camera_style.effects.length} effects
                  </Badge>
                </div>
              </CardAction>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                <FieldGroup>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <TextField
                      id="style"
                      label="Style"
                      help={fieldHelp.style}
                      value={form.style}
                      onChange={(value) => updateField("style", value)}
                      onOpenLibrary={() =>
                        openLibrary({
                          kind: "field",
                          field: "style",
                          label: "Style",
                        })
                      }
                    />
                    <TextField
                      id="image-size"
                      label="Image size"
                      help={fieldHelp.imageSize}
                      value={form.imageSize}
                      onChange={(value) => updateField("imageSize", value)}
                      onOpenLibrary={() =>
                        openLibrary({
                          kind: "field",
                          field: "imageSize",
                          label: "Image size",
                        })
                      }
                    />
                    <TextField
                      id="orientation"
                      label="Orientation"
                      help={fieldHelp.orientation}
                      value={form.orientation}
                      onChange={(value) => updateField("orientation", value)}
                      onOpenLibrary={() =>
                        openLibrary({
                          kind: "field",
                          field: "orientation",
                          label: "Orientation",
                        })
                      }
                    />
                    <TextField
                      id="resolution"
                      label="Resolution"
                      help={fieldHelp.resolution}
                      value={form.resolution}
                      onChange={(value) => updateField("resolution", value)}
                      onOpenLibrary={() =>
                        openLibrary({
                          kind: "field",
                          field: "resolution",
                          label: "Resolution",
                        })
                      }
                    />
                    <TextField
                      id="camera"
                      label="Camera look"
                      help={fieldHelp.camera}
                      value={form.camera}
                      onChange={(value) => updateField("camera", value)}
                      onOpenLibrary={() =>
                        openLibrary({
                          kind: "field",
                          field: "camera",
                          label: "Camera look",
                        })
                      }
                    />
                    <TextField
                      id="framing"
                      label="Framing"
                      help={fieldHelp.framing}
                      value={form.framing}
                      onChange={(value) => updateField("framing", value)}
                      onOpenLibrary={() =>
                        openLibrary({
                          kind: "field",
                          field: "framing",
                          label: "Framing",
                        })
                      }
                    />
                    <TextField
                      id="angle"
                      label="Angle"
                      help={fieldHelp.angle}
                      value={form.angle}
                      onChange={(value) => updateField("angle", value)}
                      onOpenLibrary={() =>
                        openLibrary({
                          kind: "field",
                          field: "angle",
                          label: "Angle",
                        })
                      }
                    />
                    <TextField
                      id="color-grading"
                      label="Color grading"
                      help={fieldHelp.colorGrading}
                      value={form.colorGrading}
                      onChange={(value) => updateField("colorGrading", value)}
                      onOpenLibrary={() =>
                        openLibrary({
                          kind: "field",
                          field: "colorGrading",
                          label: "Color grading",
                        })
                      }
                    />
                  </div>

                  <FieldSet className="gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <FieldLegend>Subjects</FieldLegend>
                          <InfoButton
                            label="What are subjects?"
                            content={fieldHelp.subjects}
                          />
                        </div>
                        <FieldDescription>
                          Add as many people, objects, or characters as the
                          image needs. Leave it empty for scene-only prompts.
                        </FieldDescription>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={addSubject}
                      >
                        <PlusIcon data-icon="inline-start" />
                        Add subject
                      </Button>
                    </div>

                    {form.subjects.length ? (
                      <div className="grid gap-4 xl:grid-cols-2">
                        {form.subjects.map((subject, index) => (
                          <SubjectFields
                            key={subject.id}
                            legend={`Subject ${index + 1}`}
                            idPrefix={subject.id}
                            subject={subject}
                            onRemove={() => removeSubject(subject.id)}
                            onIdentityChange={(value) =>
                              updateSubject(subject.id, "identity", value)
                            }
                            onPoseChange={(value) =>
                              updateSubject(subject.id, "pose", value)
                            }
                            onExpressionChange={(value) =>
                              updateSubject(subject.id, "expression", value)
                            }
                            onPropChange={(value) =>
                              updateSubject(subject.id, "prop", value)
                            }
                            onOpenLibrary={(target) => openLibrary(target)}
                          />
                        ))}
                      </div>
                    ) : (
                      <Empty className="border">
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <UserRoundIcon />
                          </EmptyMedia>
                          <EmptyTitle>No subjects added</EmptyTitle>
                          <EmptyDescription>
                            Generate a scene-focused prompt, or add a subject
                            when the image needs a person, object, or character.
                          </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={addSubject}
                          >
                            <PlusIcon data-icon="inline-start" />
                            Add first subject
                          </Button>
                        </EmptyContent>
                      </Empty>
                    )}
                  </FieldSet>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <TextField
                      id="location"
                      label="Location"
                      help={fieldHelp.location}
                      value={form.location}
                      onChange={(value) => updateField("location", value)}
                      onOpenLibrary={() =>
                        openLibrary({
                          kind: "field",
                          field: "location",
                          label: "Location",
                        })
                      }
                    />
                    <TextField
                      id="background"
                      label="Background"
                      help={fieldHelp.background}
                      value={form.background}
                      onChange={(value) => updateField("background", value)}
                      onOpenLibrary={() =>
                        openLibrary({
                          kind: "field",
                          field: "background",
                          label: "Background",
                        })
                      }
                    />
                    <TextField
                      id="lighting"
                      label="Lighting"
                      help={fieldHelp.lighting}
                      value={form.lighting}
                      onChange={(value) => updateField("lighting", value)}
                      onOpenLibrary={() =>
                        openLibrary({
                          kind: "field",
                          field: "lighting",
                          label: "Lighting",
                        })
                      }
                    />
                    <TextField
                      id="mood"
                      label="Mood"
                      help={fieldHelp.mood}
                      value={form.mood}
                      onChange={(value) => updateField("mood", value)}
                      onOpenLibrary={() =>
                        openLibrary({
                          kind: "field",
                          field: "mood",
                          label: "Mood",
                        })
                      }
                    />
                  </div>

                  <TextareaField
                    id="effects"
                    label="Visual effects"
                    help={fieldHelp.effects}
                    description="Separate items with commas. These become a natural image-quality sentence."
                    value={form.effects}
                    onChange={(value) => updateField("effects", value)}
                    onOpenLibrary={() =>
                      openLibrary({
                        kind: "field",
                        field: "effects",
                        label: "Visual effects",
                      })
                    }
                  />
                  <TextareaField
                    id="identityConstraints"
                    label="Identity constraints"
                    help={fieldHelp.identityConstraints}
                    description="Separate full rules with semicolons so facial-preservation rules stay intact."
                    value={form.identityConstraints}
                    onChange={(value) =>
                      updateField("identityConstraints", value)
                    }
                    onOpenLibrary={() =>
                      openLibrary({
                        kind: "field",
                        field: "identityConstraints",
                        label: "Identity constraints",
                      })
                    }
                  />
                  <TextareaField
                    id="negativeConstraints"
                    label="Negative constraints"
                    help={fieldHelp.negativeConstraints}
                    description="Separate avoid rules with commas or semicolons."
                    value={form.negativeConstraints}
                    onChange={(value) =>
                      updateField("negativeConstraints", value)
                    }
                    onOpenLibrary={() =>
                      openLibrary({
                        kind: "field",
                        field: "negativeConstraints",
                        label: "Negative constraints",
                      })
                    }
                  />
                </FieldGroup>

                <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Submit when the structured values are ready.
                  </p>
                  <Button type="submit" size="lg">
                    <SparklesIcon data-icon="inline-start" />
                    Generate natural prompt
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-card/95 shadow-sm lg:sticky lg:top-5">
            <CardHeader>
              <CardTitle>Generated Output</CardTitle>
              <CardDescription>
                The prompt updates from the last submitted form values.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="prompt" className="gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <TabsList>
                    <TabsTrigger value="prompt">Natural Prompt</TabsTrigger>
                    <TabsTrigger value="json">JSON</TabsTrigger>
                  </TabsList>
                  <Badge variant="secondary">
                    {outputConfig.subjects.length} subjects
                  </Badge>
                </div>

                <TabsContent value="prompt">
                  <ScrollArea className="h-[560px] rounded-lg border bg-secondary/35">
                    <pre className="p-4 text-sm leading-7 whitespace-pre-wrap">
                      {naturalPrompt}
                    </pre>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="json">
                  <ScrollArea className="h-[560px] rounded-lg border bg-secondary/35">
                    <pre className="p-4 font-mono text-xs leading-6">
                      {jsonPreview}
                    </pre>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
            </Card>
          </section>
        ) : (
          <KeywordLibrary
            activeTarget={activeLibraryTarget}
            categories={keywordCategories}
            onApplyKeyword={applyKeyword}
            onBack={() => setActiveView("composer")}
          />
        )}
      </div>
    </main>
  )
}

function KeywordLibrary({
  activeTarget,
  categories,
  onApplyKeyword,
  onBack,
}: {
  activeTarget: LibraryTarget | null
  categories: KeywordCategory[]
  onApplyKeyword: (
    category: KeywordCategory,
    keyword: string,
    mode: KeywordMode
  ) => void
  onBack: () => void
}) {
  const activeLabel = activeTarget
    ? activeTarget.kind === "subject"
      ? `${activeTarget.subjectLegend} / ${activeTarget.label.replace(
          `${activeTarget.subjectLegend} `,
          ""
        )}`
      : activeTarget.label
    : "All fields"

  return (
    <section className="flex flex-col gap-5">
      <Card className="bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle>Keyword Library</CardTitle>
          <CardDescription>
            Choose reusable phrases by prompt field, then insert or append them
            into the composer.
          </CardDescription>
          <CardAction>
            <Button type="button" variant="outline" onClick={onBack}>
              <ArrowLeftIcon data-icon="inline-start" />
              Composer
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              <BookOpenIcon data-icon="inline-start" />
              {categories.length} groups
            </Badge>
            <Badge variant="outline">Target: {activeLabel}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {categories.map((category) => {
          const isActive = isCategoryActive(category, activeTarget)

          return (
            <Card
              key={category.id}
              size="sm"
              className={
                isActive
                  ? "bg-primary/5 ring-2 ring-primary/45"
                  : "bg-card/95 shadow-sm"
              }
            >
              <CardHeader>
                <CardTitle>{category.label}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
                <CardAction>
                  {isActive ? (
                    <Badge>Active</Badge>
                  ) : (
                    <Badge variant="outline">
                      {category.kind === "subject" ? "Subject" : "Field"}
                    </Badge>
                  )}
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {category.keywords.map((keyword) => (
                    <div
                      key={keyword}
                      className="flex flex-col gap-2 rounded-lg border bg-background/70 p-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="text-sm leading-5">{keyword}</span>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onApplyKeyword(category, keyword, "replace")
                          }
                        >
                          Insert
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            onApplyKeyword(category, keyword, "append")
                          }
                        >
                          <PlusIcon data-icon="inline-start" />
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

function FieldLabelWithInfo({
  htmlFor,
  label,
  help,
  onOpenLibrary,
}: {
  htmlFor: string
  label: string
  help: string
  onOpenLibrary?: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-1">
        <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
        <InfoButton label={`What is ${label}?`} content={help} />
      </div>
      {onOpenLibrary && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`Open keyword library for ${label}`}
              onClick={onOpenLibrary}
            >
              <BookOpenIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Open keyword library</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

function InfoButton({ label, content }: { label: string; content: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" size="icon-xs" aria-label={label}>
          <InfoIcon />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{content}</TooltipContent>
    </Tooltip>
  )
}

function TextField({
  id,
  label,
  help,
  value,
  onChange,
  onOpenLibrary,
}: {
  id: string
  label: string
  help: string
  value: string
  onChange: (value: string) => void
  onOpenLibrary?: () => void
}) {
  return (
    <Field>
      <FieldLabelWithInfo
        htmlFor={id}
        label={label}
        help={help}
        onOpenLibrary={onOpenLibrary}
      />
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  )
}

function TextareaField({
  id,
  label,
  help,
  description,
  value,
  onChange,
  onOpenLibrary,
}: {
  id: string
  label: string
  help: string
  description: string
  value: string
  onChange: (value: string) => void
  onOpenLibrary?: () => void
}) {
  return (
    <Field>
      <FieldLabelWithInfo
        htmlFor={id}
        label={label}
        help={help}
        onOpenLibrary={onOpenLibrary}
      />
      <Textarea
        id={id}
        className="min-h-24"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldDescription>{description}</FieldDescription>
    </Field>
  )
}

function SubjectFields({
  legend,
  idPrefix,
  subject,
  onRemove,
  onIdentityChange,
  onPoseChange,
  onExpressionChange,
  onPropChange,
  onOpenLibrary,
}: {
  legend: string
  idPrefix: string
  subject: Subject
  onRemove: () => void
  onIdentityChange: (value: string) => void
  onPoseChange: (value: string) => void
  onExpressionChange: (value: string) => void
  onPropChange: (value: string) => void
  onOpenLibrary: (target: LibraryTarget) => void
}) {
  function subjectTarget(field: SubjectTextKey, label: string): LibraryTarget {
    return {
      kind: "subject",
      subjectId: subject.id,
      subjectLegend: legend,
      field,
      label: `${legend} ${label.toLowerCase()}`,
    }
  }

  return (
    <FieldSet className="rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <FieldLegend>{legend}</FieldLegend>
          <InfoButton
            label={`What is ${legend}?`}
            content={fieldHelp.subjects}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label={`Remove ${legend}`}
        >
          <Trash2Icon />
        </Button>
      </div>
      <FieldGroup className="gap-4">
        <TextField
          id={`${idPrefix}-identity`}
          label="Name or identity"
          help={fieldHelp.subjectIdentity}
          value={subject.identity}
          onChange={onIdentityChange}
          onOpenLibrary={() =>
            onOpenLibrary(subjectTarget("identity", "Name or identity"))
          }
        />
        <TextField
          id={`${idPrefix}-pose`}
          label="Pose"
          help={fieldHelp.subjectPose}
          value={subject.pose}
          onChange={onPoseChange}
          onOpenLibrary={() => onOpenLibrary(subjectTarget("pose", "Pose"))}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            id={`${idPrefix}-expression`}
            label="Expression"
            help={fieldHelp.subjectExpression}
            value={subject.expression}
            onChange={onExpressionChange}
            onOpenLibrary={() =>
              onOpenLibrary(subjectTarget("expression", "Expression"))
            }
          />
          <TextField
            id={`${idPrefix}-prop`}
            label="Prop"
            help={fieldHelp.subjectProp}
            value={subject.prop}
            onChange={onPropChange}
            onOpenLibrary={() => onOpenLibrary(subjectTarget("prop", "Prop"))}
          />
        </div>
      </FieldGroup>
    </FieldSet>
  )
}

export default App
