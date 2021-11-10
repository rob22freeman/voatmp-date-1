/* eslint-disable */
import { any } from "prop-types";
import {IInputs, IOutputs} from "./generated/ManifestTypes";

//Import Nunjucks libraries
import * as Nunjucks from "nunjucks";
import { parse } from "path";
export class DateComponent implements ComponentFramework.StandardControl<IInputs, IOutputs> {

	/**
	 * Empty constructor.
	 */
	constructor()
	{

	}

	  // Value of the column is stored and used inside the component
	  private _value: Date | null;
	  // Power Apps component framework delegate which will be assigned to this object which would be called whenever any update happens.
	  private _notifyOutputChanged: () => void;
	  // reference to the component container HTMLDivElement
	  // This element contains all elements of our code component example
	  private _container: HTMLDivElement;
	  // reference to Power Apps component framework Context object
	  private _context: ComponentFramework.Context<IInputs>;
	  // Event Handler 'refreshData' reference
	  private _refreshData: EventListenerOrEventListenerObject;

	  // Elements needed for setting up error messages 
	  private _formGroupDiv: HTMLDivElement;
	  private _fieldSet: HTMLFieldSetElement;
	  private _hintDiv: HTMLDivElement;

	  // Date input fields
	  private _dayInput: HTMLInputElement;
	  private _monthInput: HTMLInputElement;
	  private _yearInput: HTMLInputElement;

	  private _enableValidation : boolean;

	  private _uniqueIdentifier : string;

	  private _referenceDate : Date;

	  // Error validation methods
	  private _mustBeBefore : boolean;
	  private _mustBeAfter : boolean;
	  private _mustBeSameAsOrAfterDate : boolean;
	  private _mustBeSameAsOrBeforeDate : boolean;

	  private _mustBeTodayOrInTheFuture : boolean;
	  private _mustBeInTheFuture : boolean;
	  private _mustBeTodayOrInThePast : boolean;
	  private _mustBeInThePast : boolean;
	  private _mustBeBetween : boolean;

	  // Heading (the date being asked for), Field Identifier (for the error messaging), Hint
	  private _heading : string;
	  private _fieldIdentifier : string;
	  private _hint : string;
	  private _hintId : string;
	  
	  // Error message to be displayed
	  private _errorMessage : string;

	  private _containerLabel : string;
	  private _dayId : string;
	  private _monthId : string;
	  private _yearId : string;

	  private _errorFocusId : string;

	/**
	 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
	 * Data-set values are not initialized here, use updateView.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
	 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
	 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
	 * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
	 */
	public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container:HTMLDivElement): void
	{
		// problem - can't load dependencies
		//var sass = require('sass');
		//sass.renderSync({file: "sass.scss"});

		this.registerNunjucks();

		// Add control initialization code
		this._context = context;
		this._notifyOutputChanged = notifyOutputChanged;
		this._refreshData = this.refreshData.bind(this);	

		var heading = this._heading = context.parameters.heading.raw as string;
		var hint = this._hint = context.parameters.hint.raw as string;

		// The unique identifier should be configured to the field logical name
		this._uniqueIdentifier = context.parameters.uniqueIdentifier.raw as string; // Required so should never be null

		// Concatenate the unique identifier with the date input fields to provide IDs
		this._dayId = this._uniqueIdentifier + "-day";
		this._monthId = this._uniqueIdentifier + "-month";
		this._yearId = this._uniqueIdentifier + "-year";
		this._hintId = this._uniqueIdentifier + "-hint";
	
		// The Portal automatically generates a container for the PCF which is the field logical name suffixed with "_Container"
		this._containerLabel = this._uniqueIdentifier + "_Container";
	
		//Configure and render Nunjucks templates
		var runOnServer = "http://127.0.0.1:8080/";
		require('govuk-frontend');
		var templatePath = "node_modules/govuk-frontend/govuk/components/";
		var env = Nunjucks.configure(runOnServer + templatePath);

		var renderedNunjucksTemplate = env.render('/date-input/template.njk',{params:{
			id: this._uniqueIdentifier,
			namePrefix: this._uniqueIdentifier,
			fieldset: {
			  legend: {
				text: this._heading,
				isPageHeading: true,
				classes: "govuk-fieldset__legend--l"
			  }
			},
			hint: {
			  text: this._hint
			}
		  }});

		this._container = document.createElement("div");
		this._container.innerHTML =
		// Override that PCF Test Environment aligns to centre
			"<style>.control-pane{text-align:unset;}</style>\n" +
			renderedNunjucksTemplate;

		container.appendChild(this._container);

		this._formGroupDiv = document.getElementsByClassName("govuk-form-group")[0] as HTMLDivElement
		this._fieldSet = document.getElementsByClassName("govuk-fieldset")[0] as HTMLFieldSetElement;
		this._hintDiv = document.getElementById(this._hintId) as HTMLDivElement;

		this._dayInput = document.getElementById(this._dayId) as HTMLInputElement;
		this._monthInput = document.getElementById(this._monthId) as HTMLInputElement;
		this._yearInput = document.getElementById(this._yearId) as HTMLInputElement;

		this._dayInput.addEventListener("change", this._refreshData);
		this._monthInput.addEventListener("change", this._refreshData);
		this._yearInput.addEventListener("change", this._refreshData);

		//this._mustBeBefore = context.parameters.mustBeBefore.raw;

		this.registerPCFComponent(this);
		this.pageValidation();
		//var errorMessageText = "Oh no! It's all on fire!!!";
		//this.ShowError(errorMessageText, undefined,false , true);
		//this.HideError();
	}


/**
 * Show error on control.
 * @param errorMessageText Error message to display
 * @param highlightDayField Specify whether to apply error highlighting to day field
 * @param highlightMonthField Specify whether to apply error highlighting to month field
 * @param highlightYearField Specify whether to apply error highlighting to year field
 */
	public ShowError(errorMessageText : string, highlightDayField : boolean | undefined, highlightMonthField : boolean | undefined, highlightYearField : boolean | undefined) {

		// Hide error message if one already exists
		this.HideError();

		this._formGroupDiv.classList.add("govuk-form-group--error");

		var errorMessageId = "errorMessage";

		// Create amd add error message span
		var errorMessageSpan = document.createElement("span");
		errorMessageSpan.classList.add("govuk-error-message");
		errorMessageSpan.id = errorMessageId;
		errorMessageSpan.innerHTML = "<span class=\"govuk-visually-hidden\">Error:</span> " + errorMessageText;

		this._hintDiv.after(errorMessageSpan);


		// Add error message to field set's aria-describedby attribute,
		// if it doesn't already exist
		var ariaDescribedBy = this._fieldSet.getAttribute("aria-describedby");
		var ariaDescribedByList = ariaDescribedBy?.split(" ");
		var hasAriaDescribedByListGotId = ariaDescribedByList?.includes(errorMessageId);
		if (!hasAriaDescribedByListGotId) {
			ariaDescribedByList?.push(errorMessageId);
		}

		this._fieldSet.setAttribute("aria-describedby", ariaDescribedByList?.join(" ") ?? "");

		// Determine which fields should be highlighted
		var shouldDayFieldBeHighlighted = false;
		var shouldMonthFieldBeHighlighted = false;
		var shouldYearFieldBeHighlighted = false;

		// If no field is specified for highlighting, highlight
		// all date fields
		if(
			!highlightDayField &&
			!highlightMonthField &&
			!highlightYearField
		)
		{
			shouldDayFieldBeHighlighted = true;
			shouldMonthFieldBeHighlighted = true;
			shouldYearFieldBeHighlighted = true;
		}
		else{
			shouldDayFieldBeHighlighted = highlightDayField ?? false;
			shouldMonthFieldBeHighlighted = highlightMonthField ?? false;
			shouldYearFieldBeHighlighted = highlightYearField ?? false;
		}

		// Apply error styles to input fields
		if(shouldDayFieldBeHighlighted){
			this._dayInput.classList.add("govuk-input--error");
		}

		if(shouldMonthFieldBeHighlighted)
		{
			this._monthInput.classList.add("govuk-input--error");
		}

		if(shouldYearFieldBeHighlighted){
			this._yearInput.classList.add("govuk-input--error");
		}

		// Store error message for use in page level validation
		this._errorMessage = errorMessageText;

	}


	/**
	 * Hide error on control.
	 */
	 private HideError() {

		var errorMessageId = "errorMessage";

		// Remove form group div error styling if it's present
		this._formGroupDiv.classList.remove("govuk-form-group--error");

		// Delete error message div if it exists
		var errorMessageDiv = document.getElementById(errorMessageId);
		errorMessageDiv?.remove();




		// Remove error message from field set's aria-describedby attribute,
		// if it exists
		var ariaDescribedBy = this._fieldSet.getAttribute("aria-describedby");
		var ariaDescribedByList = ariaDescribedBy?.split(" ");
		var AriaDescribedByListErrorIdIndex = ariaDescribedByList?.indexOf(errorMessageId) ?? -1;
		if (AriaDescribedByListErrorIdIndex !== -1) {
			ariaDescribedByList?.splice(AriaDescribedByListErrorIdIndex, 1);
		}

		this._fieldSet.setAttribute("aria-describedby", ariaDescribedByList?.join(" ") ?? "");

		// Remove error styles from input fields
		this._dayInput.classList.remove("govuk-input--error");
		this._monthInput.classList.remove("govuk-input--error");
		this._yearInput.classList.remove("govuk-input--error");
	}

  /**
   * Updates the values to the internal value variable we are storing and also updates the html label that displays the value
   * @param context : The "Input Properties" containing the parameters, component metadata and interface functions
   */

   public refreshData(evt: Event): void {
		// Don't do validation until first time all 3 fields are set
		var doValidation : boolean = 
			this._enableValidation || 
			(
				(
					this._dayInput.value &&
					this._monthInput.value && 
					this._yearInput.value
				) as unknown as boolean
			);

		if(doValidation){
			
			// First time we enter validation is the first time the 3 fields were set.
			// Set the _enableValidation variable, so the next time the function is entered,
			// boolean short-circuit evaluation means we don't have to read the fields when
			// creating the doValidation variable.
			if(!this._enableValidation)
			{
				this._enableValidation = true;
			}

			var inputIsValid : boolean = this.performInputValidation();

			if (inputIsValid) {
				this._value = this.getInputDate();

				this._notifyOutputChanged();
			}
		}

  }
  	/**
	 * Converts date to GOV.UK perscribed date format, eg 1 September 2017
	 * Reference: https://www.gov.uk/guidance/style-guide/a-to-z-of-gov-uk-style#dates
	 * @param date {Date} Date to be converted to formatted string.
	 * @returns {string} Date as a string in the GOV.UK format.
	 */
  	private toGovUKDateString(date: Date) : string {
	  	return date.toLocaleDateString("en-GB", { year: 'numeric', month: 'long', day: 'numeric' });
  	}

	/**
	 * Get values from input fields and store them as a JavaScript date object.
	 * @returns {Date} Input as a JavaScript date object.
	 */
	 private getInputDate() : Date {
		var year = parseInt(this._yearInput.value);
		var month = parseInt(this._monthInput.value) - 1; // Month is zero-indexed
		var day = parseInt(this._dayInput.value);

		var inputDate = new Date(year, month, day);
		// Handle 2 digit dates (otherwise 0022 becomes 1922), see:
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#two_digit_years_map_to_1900_%e2%80%93_1999
		inputDate.setFullYear(year);
		return inputDate;
	}

	/**
	 * Capitalises first letter of error message for showError output
	 * @param string {string} Error message to have first letter capitalised.
	 * @returns {string} Error message with first letter capitalised.
	 */
	private firstCharUpperCase(string: string): string {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	/**
	 * Converts first letter of error message for showError output to lowercase (acting as a fail safe so the correct format is always displayed)
	 * @param string {string} Error message to have first letter converted to lowercase.
	 * @returns {string} Error message with first letter converted to lowercase.
	 */
	private firstCharLowerCase(string: string): string {
		return string.charAt(0).toLowerCase() + string.slice(1);
	}

	/**
	 * Validates contents of input fields and updates UI with appropriate error messages.
	 * @returns {boolean} True if validation passed. Otherwise, false.
	 * @private
	 */
	private performInputValidation() : boolean {
		var fieldIdentifier = this._fieldIdentifier = this._context.parameters.fieldIdentifierErrorMessage.raw as string;
		var isInputValid : boolean = true;

		// Reset error state
		this.HideError();

		isInputValid &&= this.handleIfDateIsIncomplete(fieldIdentifier);
		isInputValid &&= this.handleIfDateEnteredCannotBeCorrect(fieldIdentifier);
		isInputValid &&= this.handleIfDateIsInFutureWhenItNeedsToBeInPast(fieldIdentifier);
		isInputValid &&= this.handleIfDateIsInFutureWhenItNeedsToBeTodayOrInPast(fieldIdentifier);
		isInputValid &&= this.handleIfDateIsInPastWhenItNeedsToBeInFuture(fieldIdentifier);
		isInputValid &&= this.handleIfDateIsInPastWhenItNeedsToBeTodayOrInFuture(fieldIdentifier);
		isInputValid &&= this.handleIfTheDateMustBeBeforeAnotherDate(fieldIdentifier);
		isInputValid &&= this.handleIfTheDateMustBeAfterAnotherDate(fieldIdentifier);
		isInputValid &&= this.handleIfDateMustBeSameAsOrAfterAnotherDate(fieldIdentifier);
		isInputValid &&= this.handleIfDateMustBeSameAsOrBeforeAnotherDate(fieldIdentifier);
		isInputValid &&= this.handleIfDateMustBeBetweenTwoDates(fieldIdentifier);

		return isInputValid;
	}
	

private pageValidation() {

	var _window = window as any;
	if (typeof (_window.Page_Validators) == "undefined") {
		return;
	}

	var newValidator = (document.createElement('span') as any); //any = custom properties for val
	newValidator.style.display = "none";
	newValidator.id = this._uniqueIdentifier + "Validator";
	newValidator.controltovalidate = this._uniqueIdentifier;
	newValidator.evaluationfunction = function () {

		var result = _window.HSL.PCFRegistrar[this.controltovalidate].performInputValidation();
		this.isvalid = result;

		if (!this.isvalid) {
			var errorMessageText = _window.HSL.PCFRegistrar[this.controltovalidate]._errorMessage;
			this.errormessage = "<a href='#" + _window.HSL.PCFRegistrar[this.controltovalidate]._containerLabel + "' onclick=\"javascript: scrollToAndFocus('" + _window.HSL.PCFRegistrar[this.controltovalidate]._containerLabel + "', '" + _window.HSL.PCFRegistrar[this.controltovalidate]._errorFocusId + "'); return false;\">" + errorMessageText + "</a>";
		} else {
			this.errormessage = null;
		}
	}

	_window.Page_Validators.push(newValidator);
}


	/**
 	 * 	 Handle date must be between two date, per GOV.UK Design System 
 	 *   specification for Date component, in section "If the date must be between two dates"
 	 * @param fieldIdentifier {string} Identify name of field to display in error messages
 	 * @returns {boolean} Returns true if date is before other date. Otherwise false;
 	 * @private
 	 */
	private handleIfDateMustBeBetweenTwoDates(fieldIdentifier: string): boolean {
	
		this._mustBeBetween = (!this._context.parameters.relativeToAnotherDate.raw) ? false : this._context.parameters.relativeToAnotherDate.raw == "5";

		if(!this._mustBeBetween) 
		{
			return true;
		}

		var inputDate = this.getInputDate();
		let referenceDateInput1 = this._context.parameters.referenceDate1.raw as Date;
			referenceDateInput1 = new Date(referenceDateInput1.setHours(0, 0, 0, 0));
		let referenceDateInput2 = this._context.parameters.referenceDate2.raw as Date;
			referenceDateInput2 = new Date(referenceDateInput2.setHours(0, 0, 0, 0));
		var isDateBetweenDesignatedDates = (inputDate > referenceDateInput1) && (inputDate < referenceDateInput2);

		if(!isDateBetweenDesignatedDates){
			this.ShowError(this.firstCharUpperCase(fieldIdentifier) + " must be between " + this.toGovUKDateString(referenceDateInput1) + " and " + this.toGovUKDateString(referenceDateInput2), true, true, true);
			this._errorFocusId = this._dayId;
		}

		return isDateBetweenDesignatedDates;
		
	}

	/**
 	 * 	 Handle date must be before another, per GOV.UK Design System 
 	 *   specification for Date component, in section "If the date must be before another date"
 	 * @param fieldIdentifier {string} Identify name of field to display in error messages
 	 * @returns {boolean} Returns true if date is before other date. Otherwise false;
 	 * @private
 	 */
	private handleIfTheDateMustBeBeforeAnotherDate (fieldIdentifier: string) : boolean {

		this._mustBeBefore = (!this._context.parameters.relativeToAnotherDate.raw) ? false : this._context.parameters.relativeToAnotherDate.raw == "1";
	
		if(!this._mustBeBefore)
		{
			return true;
		}
	
		var inputDate = this.getInputDate();
		let referenceDateInput = this._context.parameters.referenceDate1.raw as Date;
			referenceDateInput = new Date(referenceDateInput.setHours(0, 0, 0, 0));
		var isDateBeforeDesignatedDate = inputDate < referenceDateInput;
		
		if(!isDateBeforeDesignatedDate){
			this.ShowError(this.firstCharUpperCase(fieldIdentifier) + " must be before " + this.toGovUKDateString(referenceDateInput), true, true, true);
			this._errorFocusId = this._dayId;
		}
		
		return isDateBeforeDesignatedDate;
	
	 }

	/**
 	 * 	 Handle date must be after another, per GOV.UK Design System 
 	 *   specification for Date component, in section "If the date must be after another date"
 	 * @param fieldIdentifier {string} Identify name of field to display in error messages
 	 * @returns {boolean} Returns true if date is after other date. Otherwise false;
 	 * @private
 	 */
	private handleIfTheDateMustBeAfterAnotherDate(fieldIdentifier: string): boolean {
		
		this._mustBeAfter = (!this._context.parameters.relativeToAnotherDate.raw) ? false : this._context.parameters.relativeToAnotherDate.raw == "2";

		if(!this._mustBeAfter)
		{
			return true;
		}
	
		var inputDate = this.getInputDate();
		let referenceDateInput = this._context.parameters.referenceDate1.raw as Date;
			referenceDateInput = new Date(referenceDateInput.setHours(0, 0, 0, 0));
		var isDateAfterDesignatedDate = inputDate > referenceDateInput;
		
		if(!isDateAfterDesignatedDate){
			this.ShowError(this.firstCharUpperCase(fieldIdentifier) + " must be after " + this.toGovUKDateString(referenceDateInput), true, true, true);
			this._errorFocusId = this._dayId;
		}
		
		return isDateAfterDesignatedDate;
	
	 }

	/**
	 *   Handle if the date must be the same as or before another date,
	 * 	 per GOV.UK Design System spec for Date component, in section 
	 *   "If the date must be the same as or before another date"
	 * @param fieldIdentifier {string} Identify name of field to display in error messages
	 * @returns {boolean} Returns true if date is the same as or before another date, Otherwise false;
	 * @private
	 */		
	private handleIfDateMustBeSameAsOrBeforeAnotherDate(fieldIdentifier: string): boolean {
		
		this._mustBeSameAsOrBeforeDate = (!this._context.parameters.relativeToAnotherDate.raw) ? false : this._context.parameters.relativeToAnotherDate.raw == "3";

		if(!this._mustBeSameAsOrBeforeDate)
		{
			return true;
		}
	
		var inputDate = this.getInputDate();
		let referenceDateInput = this._context.parameters.referenceDate1.raw as Date;
			referenceDateInput = new Date(referenceDateInput.setHours(0, 0, 0, 0));
		var isDateSameAsOrBeforeDesignatedDate = inputDate <= referenceDateInput;
		
		if(!isDateSameAsOrBeforeDesignatedDate){
			this.ShowError(this.firstCharUpperCase(fieldIdentifier) + " must be the same as or before " + this.toGovUKDateString(referenceDateInput), true, true, true);
			this._errorFocusId = this._dayId;
		}
		
		return isDateSameAsOrBeforeDesignatedDate;

	 }

	/**
	 *   Handle if the date must be the same as or after another date,
	 * 	 per GOV.UK Design System spec for Date component, in section 
	 *   "If the date must be the same as or after another date"
	 * @param fieldIdentifier {string} Identify name of field to display in error messages
	 * @returns {boolean} Returns true if date is not incomplete. Otherwise false;
	 * @private
	 */		
	private handleIfDateMustBeSameAsOrAfterAnotherDate(fieldIdentifier: string): boolean {
		
		this._mustBeSameAsOrAfterDate = (!this._context.parameters.relativeToAnotherDate.raw) ? false : this._context.parameters.relativeToAnotherDate.raw == "4";

		if(!this._mustBeSameAsOrAfterDate)
		{
			return true;
		}
	
		var inputDate = this.getInputDate();
		let referenceDateInput = this._context.parameters.referenceDate1.raw as Date;
			referenceDateInput = new Date(referenceDateInput.setHours(0, 0, 0, 0));
		var isDateSameAsOrAfterDesignatedDate = inputDate >= referenceDateInput;
		
		if(!isDateSameAsOrAfterDesignatedDate){
			this.ShowError(this.firstCharUpperCase(fieldIdentifier) + " must be the same as or after " + this.toGovUKDateString(referenceDateInput), true, true, true);
			this._errorFocusId = this._dayId;
		}
		
		return isDateSameAsOrAfterDesignatedDate;

	 }

	/**
	 *   Handle if the date is in the future when it needs to be in the past, 
	 *   per GOV.UK Design System spec for Date component, in section 
	 *   "If the date is in the future when it needs to be in the past"
	 * @param fieldIdentifier {string} Indentify name of field to display in error messages
	 * @returns {boolean} Returns true if date is not incomplete. Otherwise false;
	 * @private
	 */
	 private handleIfDateIsInFutureWhenItNeedsToBeInPast(fieldIdentifier: string): boolean {
	
		this._mustBeInThePast = (!this._context.parameters.relativeToToday.raw) ? false : this._context.parameters.relativeToToday.raw == "1";

		if(!this._mustBeInThePast)
		{
			return true;
		}
	
		var inputDate = this.getInputDate();
		var today = new Date(new Date().setHours(0, 0, 0, 0));
		var isDateBeforeToday = inputDate < today;
		
		if(!isDateBeforeToday){
			this.ShowError(this.firstCharUpperCase(fieldIdentifier) + " must be in the past", true, true, true);
			this._errorFocusId = this._dayId;
		}
	
		return isDateBeforeToday;
	 }

	/**
	 *   Handle if the date is in the past when it needs to be in the future, 
	 *   per GOV.UK Design System spec for Date component, in section 
	 *   "If the date is in the past when it needs to be in the future"
	 * @param fieldIdentifier {string} Indentify name of field to display in error messages
	 * @returns {boolean} Returns true if date is not incomplete. Otherwise false;
	 * @private
	 */	
	 private handleIfDateIsInPastWhenItNeedsToBeInFuture(fieldIdentifier: string): boolean {
		
		this._mustBeInTheFuture = (!this._context.parameters.relativeToToday.raw) ? false : this._context.parameters.relativeToToday.raw == "2";

		if(!this._mustBeInTheFuture)
		{
			return true;
		}
	
		var inputDate = this.getInputDate();
		var today = new Date(new Date().setHours(0, 0, 0, 0));
		var isDateAfterToday = inputDate > today;
		
		if(!isDateAfterToday){
			this.ShowError(this.firstCharUpperCase(fieldIdentifier) + " must be in the future", true, true, true);
			this._errorFocusId = this._dayId;
		}
		
		return isDateAfterToday;

	 }

	/**
	 *   Handle if the date is in the future when it needs to be today or in the past, 
	 *   per GOV.UK Design System spec for Date component, in section 
	 *   "If the date is in the future when it needs to be today or in the past"
	 * @param fieldIdentifier {string} Indentify name of field to display in error messages
	 * @returns {boolean} Returns true if date is not incomplete. Otherwise false;
	 * @private
	 */
	 private handleIfDateIsInFutureWhenItNeedsToBeTodayOrInPast(fieldIdentifier: string): boolean {
		
		this._mustBeTodayOrInThePast = (!this._context.parameters.relativeToToday.raw) ? false : this._context.parameters.relativeToToday.raw == "3";

		if(!this._mustBeTodayOrInThePast)
		{
			return true;
		}
	
		var inputDate = this.getInputDate();
		var today = new Date(new Date().setHours(0, 0, 0, 0));
		var isDateTodayOrBefore = inputDate <= today;
		
		if(!isDateTodayOrBefore){
			this.ShowError(this.firstCharUpperCase(fieldIdentifier) + " must be today or in the past", true, true, true);
			this._errorFocusId = this._dayId;
		}
		
		return isDateTodayOrBefore;

	 }

	/**
	 *   Handle if the date is in the future when it needs to be today or in the future, 
	 * 	 per GOV.UK Design System spec for Date component, in section 
	 *   "If the date is in the past when it needs to be today or in the future"
	 * @param fieldIdentifier {string} Indentify name of field to display in error messages
	 * @returns {boolean} Returns true if date is not incomplete. Otherwise false;
	 * @private
	 */		
	private handleIfDateIsInPastWhenItNeedsToBeTodayOrInFuture(fieldIdentifier: string): boolean {
		
		this._mustBeTodayOrInTheFuture = (!this._context.parameters.relativeToToday.raw) ? false : this._context.parameters.relativeToToday.raw == "4";

		if(!this._mustBeTodayOrInTheFuture)
		{
			return true;
		}
	
		var inputDate = this.getInputDate();
		var today = new Date(new Date().setHours(0, 0, 0, 0));
		var isDateTodayOrAfter = inputDate >= today;
		
		if(!isDateTodayOrAfter){
			this.ShowError(this.firstCharUpperCase(fieldIdentifier) + " must be today or in the future", true, true, true);
			this._errorFocusId = this._dayId;
		}
		
		return isDateTodayOrAfter;
	 }

	/**
	 * 	 Handle incomplete date, per GOV.UK Design System specification for Date component,
	 * 	 in section "If the date is incomplete"
	 * @param fieldIdentifier {string} Identify name of field to display in error messages
	 * @returns {boolean} Returns true if date is not incomplete. Otherwise false;
	 * @private
	 */
	private handleIfDateIsIncomplete (fieldIdentifier: string) : boolean {
		var isDayMissing = !this._dayInput.value
		var isMonthMissing = !this._monthInput.value
		var isYearMissing = !this._yearInput.value
		var isMoreThanOneFieldMissing = isDayMissing ? (isMonthMissing || isYearMissing) : (isMonthMissing && isYearMissing)

		// RF
		var allFieldsMissing = isDayMissing && isMonthMissing && isYearMissing;
			
		if (allFieldsMissing) {
            this.ShowError('Enter ' + this.firstCharLowerCase(fieldIdentifier), false, false, false);
			this._errorFocusId = this._dayId;
        } else {
		// RF


		if (isDayMissing) {
			this.ShowError(this.firstCharUpperCase(fieldIdentifier) + ' must include a day', true, false, false);
			this._errorFocusId = this._dayId;
		}

		if (isMonthMissing) {
			this.ShowError(this.firstCharUpperCase(fieldIdentifier) + ' must include a month', false, true, false);
			this._errorFocusId = this._monthId;
		}

		if (isYearMissing) {
			this.ShowError(this.firstCharUpperCase(fieldIdentifier) + ' must include a year', false, false, true);
			this._errorFocusId = this._yearId;
		}

		if (isMoreThanOneFieldMissing) {
			var errorMessage = this.firstCharUpperCase(fieldIdentifier) + ' must include a '
			var errorFieldDescriptors: string[] = []

			if (isDayMissing) {
				errorFieldDescriptors.push('day')
			}

			if (isMonthMissing) {
				errorFieldDescriptors.push('month')
			}

			if (isYearMissing) {
				errorFieldDescriptors.push('year')
			}

			errorMessage += errorFieldDescriptors.join(', ')

			// Replace last occurence of ", " with " and "
			// Src: https://stackoverflow.com/a/23137090
			var lastIndexOfCommaSpace = errorMessage.lastIndexOf(', ')
			errorMessage = errorMessage.slice(0, lastIndexOfCommaSpace) + errorMessage.slice(lastIndexOfCommaSpace).replace(', ', ' and ')

			this.ShowError(errorMessage, true, true, true);
			if (!isDayMissing) {
				this._errorFocusId = this._monthId;
			} else {
				this._errorFocusId = this._dayId;
			}
		}
	}

	return !isDayMissing && !isMonthMissing && !isYearMissing;


	}

	// The two following methods are used for date validation.
	//Src: https://stackoverflow.com/a/1433119

	private daysInMonth(month : number , year : number) : number { // m is 0 indexed: 0-11
		switch (month) {
			case 1 :
				return (year % 4 == 0 && year % 100) || year % 400 == 0 ? 29 : 28;
			case 8 : case 3 : case 5 : case 10 :
				return 30;
			default :
				return 31
		}
	}

	private isValidDate(day : number, month : number, year : number) {
		// return month > 0 && month < 13 && day > 0 && day <= this.daysInMonth(month, year);
		// Replaced the statement below to correct month entry error
		return month >= 0 && month < 12 && day > 0 && day <= this.daysInMonth(month, year);
	}

	/**
	 * 	 Handle if date entered is not correct, per GOV.UK Design System specification
	 * 	 for Date component, in section "If the date entered cannot be correct"
	 * @param fieldIdentifier {string} Identify name of field to display in error messages
	 * @returns {boolean} Returns true if date is a real date. Otherwise false;
	 * @private
	 */
	 private handleIfDateEnteredCannotBeCorrect (fieldIdentifier: string) : boolean {
	
		var isDateCorrect = this.isValidDate(			
			parseInt(this._dayInput.value),
			parseInt(this._monthInput.value) -1,
			parseInt(this._yearInput.value)
		);
		
		if(!isDateCorrect){
			this.ShowError(this.firstCharUpperCase(fieldIdentifier) + " must be a real date", true, true, true);
		}
		
		return isDateCorrect;


	}

	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
	public updateView(context: ComponentFramework.Context<IInputs>): void
	{
		// storing the latest context from the control.
		this._value = context.parameters.dateValue.raw;
	  	this._context = context;

		if(this._value){
			this._dayInput.valueAsNumber = this._value.getDate();
			this._monthInput.valueAsNumber = this._value.getMonth() + 1; // getMonth returns zero-based value
			this._yearInput.valueAsNumber = this._value.getFullYear();

			// All 3 fields are set, start validation following any changes
			this._enableValidation = true;
		}

	}

	/**
	 * It is called by the framework prior to a control receiving new data.
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs
	{
		return {
			dateValue: (this._value === null ? undefined : this._value) // dateValue is type Date | undefined
		  };
	}

	/**
	 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
	 * i.e. cancelling any pending remote calls, removing listeners, etc.
	 */
	public destroy(): void
	{
		// Add code to cleanup control if necessary

		this._dayInput.removeEventListener("change", this._refreshData);
		this._monthInput.removeEventListener("change", this._refreshData);
		this._yearInput.removeEventListener("change", this._refreshData);
	}

	private registerPCFComponent(currentInstance:DateComponent) : void
	{
		var globalScope = (window as any);

		if(!globalScope.HSL)
		{
			globalScope.HSL = {};
		}

		if(!globalScope.HSL.PCFRegistrar)
		{
			globalScope.HSL.PCFRegistrar = {};
		}

		globalScope.HSL.PCFRegistrar[this._uniqueIdentifier] = currentInstance;

	};

	private registerNunjucks() : void
	{
		var globalScope = (window as any);

		globalScope.nunjucks = Nunjucks;
		
		//reconfigure template render to understand relative paths
		globalScope.nunjucks.Environment.prototype.resolveTemplate = function resolveTemplate(loader:any, parentName:any, filename:any) {
			var isRelative = loader.isRelative && parentName ? loader.isRelative(filename) : false;
			return isRelative && loader.resolve ? filename.replace('..', '').replace('./', parentName.substring(0, parentName.lastIndexOf("/")) + '/') : filename;
		  };
		}

}