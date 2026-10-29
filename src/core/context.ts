/**
 * Minimal structural typings for the DSH client services this plugin uses.
 *
 * The plugin ships standalone (it is not built inside the DSH checkout), so it
 * cannot import the official service interfaces at compile time. These shapes
 * mirror the published contracts and keep the plugin honest about what it
 * touches: a service that renames a member fails the typecheck here instead of
 * failing silently at runtime.
 */
import type { Context } from '@deepseek-ai/cordis'

/** One dictionary set registered under a namespace. */
export interface DictionaryPair {
  zh: Record<string, string>
  en: Record<string, string>
}

/** Locale service: registers dictionaries and binds a translator. */
export interface LocaleService {
  register(namespace: string, dictionaries: DictionaryPair): () => void
}

/** Settings form snapshot for one Host plugin namespace. */
export interface FormSnapshot {
  value?: Record<string, unknown>
}

/** Settings form controller for one Host plugin namespace. */
export interface ConfigForm {
  getSnapshot(): FormSnapshot
  subscribe(listener: () => void): () => void
  set(field: string, value: unknown): Promise<boolean>
}

/** Settings form service: one controller per Host plugin entry id. */
export interface ConfigFormsService {
  get(entryId: string): ConfigForm
}

/** Slot registration options this plugin supplies. */
export interface SlotRegistration {
  name: string
  id?: string
  order?: number
  locale?: string
  inject?: () => Record<string, unknown>
}

/** Slot service face used by this plugin. */
export interface SlotsService {
  inject(name: string, register: () => () => void): void
  register(options: SlotRegistration, component: unknown): () => void
}

/** The client context as this plugin consumes it. */
export type ClientContext = Context & {
  locale: LocaleService
  configForms: ConfigFormsService
  slots: SlotsService
}

/** Host settings service face used by the host half. */
export interface HostSettingsService {
  configure(presentation: { auto: boolean }, owner: unknown): () => void
}
