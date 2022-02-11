// This shouldn't even be necessary, docs say props of objects shouldn't trigger this rule but it does?
/* eslint-disable no-param-reassign */
import { Component, WhisperComponentType } from '@oliveai/ldk/dist/whisper';

import * as Transports from './transports';

/**
 * Main class for interacting with different analytics providers
 * Must be provided a Transport at construction or before calling any track methods
 */
class AnalyticsClient {
  constructor(public transport?: Transports.BaseTransport) {}

  get currentWhisperName() {
    return this.transport?.currentWhisperName;
  }

  /** Provided for setting the transport after instancing */
  setTransport(transport: Transports.BaseTransport) {
    this.transport = transport;
  }

  /**
   * Default method for what to do when a whisper is displayed
   *
   * @param whisperName Either the label or a distinct name for the whisper
   * @param isUpdated Whether the whisper was displayed through create or update
   */
  async trackWhisperDisplayed(whisperName: string, isUpdated: boolean) {
    if (!this.transport) return;
    await this.transport.trackWhisperDisplayed(whisperName, isUpdated);
  }

  /**
   * Default method for what to do when a whisper is closed
   *
   * @param whisperName Either the label or a distinct name for the whisper
   */
  async trackWhisperClosed(whisperName: string) {
    if (!this.transport) return;
    await this.transport.trackWhisperClosed(whisperName);
  }

  /**
   * Default method for what to do when a component's onClick handler is triggered
   *
   * @param componentType The LDK provided identifier for the type of component
   */
  async trackComponentClicked(componentType: WhisperComponentType) {
    if (!this.transport) return;
    await this.transport.trackComponentClicked(componentType);
  }

  /**
   * Default method for what to do when a component's onCopy handler is triggered
   *
   * @param componentType The LDK provided identifier for the type of component
   */
  async trackComponentCopied(componentType: WhisperComponentType) {
    if (!this.transport) return;
    await this.transport.trackComponentCopied(componentType);
  }

  /**
   * Generic tracking method, up to the Transport to define what the props should be
   *
   * @param props Some kind of object passed through to the Transport for handling events
   */
  async trackEvent(props: Record<string, unknown>) {
    if (!this.transport) return;
    await this.transport.trackEvent(props);
  }

  /**
   * Set a component's handlers to a wrapped version that will call GA then the original handler
   */
  wrapComponent(component: Component) {
    /**
     * This generic function accepts the existing handler and the desired event function, returns a
     * function that calls the event function and then calls the existing handler if it exists.
     *
     * TODO:  Figure out what the handler type can be without making a giant conditional type of all whisper handlers
     */
    function handlerWrapper<F extends (...args: any[]) => void>(
      handler: F | undefined,
      trackFn: () => Promise<void>
    ) {
      return async function _(...args: unknown[]) {
        await trackFn();
        if (handler) handler(...args);
      };
    }

    // === Click Handlers ===
    const onClickHandler = async () => this.trackComponentClicked(component.type);
    if ('onClick' in component) {
      component.onClick = handlerWrapper(component.onClick, onClickHandler);
    }
    if ('onLinkClick' in component) {
      component.onLinkClick = handlerWrapper(component.onLinkClick, onClickHandler);
    }

    // === Copy Handlers ===
    const onCopyHandler = async () => this.trackComponentCopied(component.type);
    if ('onCopy' in component) {
      component.onCopy = handlerWrapper(component.onCopy, onCopyHandler);
    }

    return component;
  }

  /**
   * Go through an array of components and their children and attempt to wrap handlers with event tracking
   *
   * TODO: Enhancements
   * 1. Define a helpful options object: force wrap undefined handlers, override names, etc.
   * 2. Extend the component type to some kind of TrackedComponent to help protect from accidentally wrapping components multiple times
   */
  wrapComponents(components: Component[]) {
    return components.map((component) => {
      // Wrap each component in Box or CollapseBox children
      if ('children' in component) {
        component.children = this.wrapComponents(component.children) as typeof component.children;
        return component;
      }
      // Wrap each component in Breadcrumb children
      if ('links' in component) {
        component.links = this.wrapComponents(component.links) as typeof component.links;
        return component;
      }
      return this.wrapComponent(component);
    });
  }
}

export { AnalyticsClient, Transports };
