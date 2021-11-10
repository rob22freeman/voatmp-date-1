/*
*This is auto generated from the ControlManifest.Input.xml file
*/

// Define IInputs and IOutputs Type. They should match with ControlManifest.
export interface IInputs {
    dateValue: ComponentFramework.PropertyTypes.DateTimeProperty;
    heading: ComponentFramework.PropertyTypes.StringProperty;
    fieldIdentifierErrorMessage: ComponentFramework.PropertyTypes.StringProperty;
    hint: ComponentFramework.PropertyTypes.StringProperty;
    uniqueIdentifier: ComponentFramework.PropertyTypes.StringProperty;
    relativeToToday: ComponentFramework.PropertyTypes.EnumProperty<"1" | "2" | "3" | "4">;
    referenceDate1: ComponentFramework.PropertyTypes.DateTimeProperty;
    referenceDate2: ComponentFramework.PropertyTypes.DateTimeProperty;
    relativeToAnotherDate: ComponentFramework.PropertyTypes.EnumProperty<"1" | "2" | "3" | "4" | "5">;
}
export interface IOutputs {
    dateValue?: Date;
}
