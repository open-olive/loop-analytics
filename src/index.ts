// This shouldn't even be necessary, docs say props of objects shouldn't trigger this rule but it does?
/* eslint-disable no-param-reassign */
import { Component, WhisperComponentType } from '@oliveai/ldk/dist/whisper';

import { Transport } from './transports/baseTransport';

export { GoogleTransport, SegmentTransport } from './transports';

export default class Analytics {
  transport?: Transport;

  setTransport(transport: Transport) {
    this.transport = transport;
  }

  async trackWhisperDisplayed(whisperName: string, isUpdated: boolean) {
    if (!this.transport) return;
    await this.transport.trackWhisperDisplayed(whisperName, isUpdated);
  }

  async trackWhisperClosed(whisperName: string) {
    if (!this.transport) return;
    await this.transport.trackWhisperClosed(whisperName);
  }

  async trackComponentClicked(componentType: WhisperComponentType) {
    if (!this.transport) return;
    await this.transport.trackComponentClicked(componentType);
  }

  async trackComponentCopied(componentType: WhisperComponentType) {
    if (!this.transport) return;
    await this.transport.trackComponentCopied(componentType);
  }

  async trackEvent(props: any) {
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
