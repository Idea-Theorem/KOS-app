/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */

import { KosModelRegistrationFactory } from '@kosdev-code/kos-ui-sdk';
import type { BundleOptions } from './types';
import { BundleModelImpl, MODEL_TYPE } from './bundle-model';
import type { BundleModel } from './bundle-model';

/**
 * # Bundle
 *
 * The registration bean includes convenience methods for creating and working with BundleModel instances.
 *
 * ## type
 * The type property is a string that identifies the model type.
 * The type is used to identify the model type in the model registry and to narrow down the model type in type predicates.  It's most frequently
 * used when declaring dependencies on models.
 *
 * @example
 * ```typescript
 *
 * @kosDependency({modelType: Bundle.type, id: "bundleId"})
 * private bundleModel: BundleModel;
 * ```
 *
 *
 * ## factory
 *
 * The factory method creates a factory function that can be used to create new BundleModel instances.
 *
 
 * The factory function is a curried function that takes the model id as the first argument and the options as the second argument.
 *
 * If a model with the specified id already exists, the factory function will return the existing model.  The options will be ignored
 * in this case and the existing model will be returned in its current state.
 *
 * @example
 * ```typescript
 * const model = Bundle.factory("bundleId")({
 *   // Add option data
 * });
 * ```
 

 *
 * ## predicate
 *
 * [Typescript type predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) function that will identify and narrow down a model to a BundleModel.
 *
 * @example
 * ```typescript
 *
 * const model: IKosDataModel = ...; // some model
 *
 * if (Bundle.predicate(model)) {
 *    // if the function evaluates to true, the model is narrowed down to BundleModel
 *    // and the compiler will know that the model has the BundleModel interface
 *    model.updateAvailability(false);
 * }
 * ```
 *
 * ## registration
 *
 * The registration property is an object that can be used to simplify registration of the model with the model registry.  The registration object
 * can be spread into the model registration and provides all of the required information to register the model implementation class against the model type.
 *
 *
 * @example
 *
 * In an application registration file you can declare the model registration as follows:
 *
 * **registration.ts**
 * ```typescript
 * import { Bundle } from "@kos-ui/project-models";
 * import { KosModelRegistry } from "@kosdev-code/kos-dispense-sdk";
 *
 * import { initKosProvider } from "@kosdev-code/kos-ui-sdk";
 *
 * KosModelRegistry.dispense
 * .models()
 * .model(Bundle);
 * ```
 *
 * ## registration.singleton
 
 * The bundle model is NOT a singleton model.  This means that each time the factory function is called with a unique ID, a new model instance will be created.
 * If the factory function is called with an ID that already exists, the existing model will be returned.
 
 * */
export const Bundle = new KosModelRegistrationFactory<
  BundleModel,
  BundleOptions
>({
  class: BundleModelImpl,
  type: MODEL_TYPE,
});
