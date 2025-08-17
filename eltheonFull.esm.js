/**
 * Stores the original console methods to avoid recursive interception.
 * @constant
 * @private
 */
const originalConsole = {
    log: window.console.log,
    info: window.console.info,
    warn: window.console.warn,
    error: window.console.error,
    debug: window.console.debug
};
/**
 * Configurable logging module with support for multiple handlers.
 * @namespace logger
 */
const logger = {
    /**
     * List of registered log handlers.
     * @type {LogHandler[]}
     */
    handlers: [],
    /**
     * Adds a custom log handler.
     * @param {LogHandler} handler - The log function to be called.
     */
    addHandler(handler) {
        this.handlers.push(handler);
    },
    /**
     * Logs a message with a specific log level.
     * @param {LogLevel} type - The log level (log, info, warn, error, debug).
     * @param {any} message - The log message.
     * @param {...any} optionalParams - Additional parameters.
     */
    log(type, message, ...optionalParams) {
        this.handlers.forEach(handler => handler(type, message, ...optionalParams));
        LoggerDebugHelper.handleLog(type, message, ...optionalParams);
    },
    /**
     * Specific methods for each log level.
     * @param {any} message - The message to log.
     * @param {...any} params - Additional parameters.
     */
    logMessage(message, ...params) { this.log("log", message, ...params); },
    /**
     * Specific methods for each info level.
     * @param {any} message - The message to log.
     * @param {...any} params - Additional parameters.
     */
    info(message, ...params) { this.log("info", message, ...params); },
    /**
     * Specific methods for each warn level.
     * @param {any} message - The message to log.
     * @param {...any} params - Additional parameters.
     */
    warn(message, ...params) { this.log("warn", message, ...params); },
    /**
     * Specific methods for each error level.
     * @param {any} message - The message to log.
     * @param {...any} params - Additional parameters.
     */
    error(message, ...params) { this.log("error", message, ...params); },
    /**
     * Specific methods for each debug level.
     * @param {any} message - The message to log.
     * @param {...any} params - Additional parameters.
     */
    debug(message, ...params) { this.log("debug", message, ...params); }
};
/**
 * Default console handler for EltheonJS logger.
 * Writes logs directly to the browser's native console.
 * Uses the original (unintercepted) console functions to avoid infinite loops.
 * @type {LogHandler}
 * @example logger.addHandler(consoleHandler);
 *
 */
const consoleHandler = (type, message, ...params) => {
    const time = new Date().toISOString();
    if (["log", "info", "warn", "error", "debug"].includes(type) && typeof originalConsole[type] === "function") {
        originalConsole[type](`[${time}] [${type.toUpperCase()}]`, message, ...params);
    }
    else {
        originalConsole.log(`[${time}] [LOGGER WARNING] Invalid log level: '${type}', Message:`, message, ...params);
    }
};
/**
 * Intercepts global `console` calls and forwards them to EltheonJS.logger,
 * unless the call originated from the logger itself.
 * Prevents infinite loops by NOT using the intercepted console inside the logger handlers.
 * @private
 */
(function interceptConsole() {
    const intercept = (type) => {
        return function (message, ...params) {
            // Try to detect if the call originated from logger to avoid loops
            const stack = new Error().stack || "";
            const isLoggerCall = stack.includes("logger.ts") || stack.includes("EltheonJS.logger");
            // Only forward to logger if not already inside logger
            if (!isLoggerCall && typeof logger.log === "function") {
                if (type !== "log")
                    logger.log(type, message, ...params);
            }
            // Always use original console (never intercepted!)
            if (typeof originalConsole[type] === "function") {
                originalConsole[type](message, ...params);
            }
            else {
                originalConsole.log(message, ...params);
            }
        };
    };
    // Override global console methods with interceptors
    window.console.log = intercept("log");
    window.console.info = intercept("info");
    window.console.warn = intercept("warn");
    window.console.error = intercept("error");
    window.console.debug = intercept("debug");
})();
/**
 * Internal Debugging Helper for Logger.
 * @class
 */
class LoggerDebugHelper {
    /**
     * Registers an external debug module if available.
     * @param {any} debugModule - The debug module to register.
     */
    static registerDebugModule(debugModule) {
        this.debugModule = debugModule;
    }
    /**
     * Allows external listeners to subscribe to log events.
     * @param {function(LogLevel, any, ...any[]): void} callback - The callback function.
     */
    static addCallback(callback) {
        this.callbacks.push(callback);
    }
    /**
     * Handles log messages and forwards them to the registered debug module.
     * @param {LogLevel} type - The log level.
     * @param {any} message - The log message.
     * @param {...any} params - Additional parameters.
     */
    static handleLog(type, message, ...params) {
        this.callbacks.forEach(cb => cb(type, message, ...params));
        if (this.debugModule && typeof this.debugModule.handleLog === "function") {
            this.debugModule.handleLog(type, message, ...params);
        }
    }
}
/**
 * The registered debug module (if available).
 * @private
 * @type {any}
 */
LoggerDebugHelper.debugModule = null;
/**
 * List of callbacks for handling debug logs.
 * @private
 * @type {Array<function(LogLevel, any, ...any[]): void>}
 */
LoggerDebugHelper.callbacks = [];
try {
    if (typeof debug === "undefined" || !debug) {
        logger.error("[logger] Debug is missing.", new Error("Debug module is not available."));
    }
    else {
        LoggerDebugHelper.registerDebugModule(debug);
    }
}
catch (error) {
    console.warn("Debugging module not available, skipping debug integration.");
}

/**
 * @fileoverview Module for API/Fetch communication in EltheonJS.
 * Provides methods for HTTP requests with support for JSON and text.
 * @module api
 * @memberof EltheonJSCore
 *
 */
var __awaiter$7 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * API module for HTTP requests.
 * Provides methods for retrieving (GET) and sending (POST/PUT/DELETE) JSON and text.
 * @namespace api
 */
const api = {
    /**
     * Retrieves JSON data via GET.
     *
     * @param {string} url - The API or resource URL.
     * @param {Record<string, string>} [headers={}] - Additional headers for the request.
     * @returns {Promise<any>} - Parsed JSON response.
     */
    getJSON(url_1) {
        return __awaiter$7(this, arguments, void 0, function* (url, headers = {}) {
            return this.fetchData(url, "GET", null, Object.assign({ Accept: "application/json" }, headers));
        });
    },
    /**
     * Sends JSON data via POST.
     * @param {string} url - Target URL.
     * @param {unknown} data - JSON data to be sent.
     * @param {Record<string, string>} [headers={}] - Additional headers for the request.
     * @returns {Promise<any>} - Parsed JSON response.
     */
    postJSON(url_1, data_1) {
        return __awaiter$7(this, arguments, void 0, function* (url, data, headers = {}) {
            return this.fetchData(url, "POST", data, Object.assign({ "Content-Type": "application/json", Accept: "application/json" }, headers));
        });
    },
    /**
     * Updates JSON data via PUT.
     * @param {string} url - Target URL.
     * @param {unknown} data - JSON data to be sent.
     * @param {Record<string, string>} [headers={}] - Additional headers for the request.
     * @returns {Promise<any>} - Parsed JSON response.
     */
    putJSON(url_1, data_1) {
        return __awaiter$7(this, arguments, void 0, function* (url, data, headers = {}) {
            return this.fetchData(url, "PUT", data, Object.assign({ "Content-Type": "application/json", Accept: "application/json" }, headers));
        });
    },
    /**
     * Deletes JSON data via DELETE.
     * @param {string} url - Target URL.
     * @param {Record<string, string>} [headers={}] - Additional headers for the request.
     * @returns {Promise<any>} - Parsed JSON response (if available).
     */
    deleteJSON(url_1) {
        return __awaiter$7(this, arguments, void 0, function* (url, headers = {}) {
            return this.fetchData(url, "DELETE", null, Object.assign({ Accept: "application/json" }, headers));
        });
    },
    // ---------------------------------------------------------
    //  TEXT/HTML Variant
    // ---------------------------------------------------------
    /**
     * Loads raw text data (e.g., HTML snippet, Markdown, etc.).
     * @param {string} url - The API or resource URL.
     * @param {Record<string, string>} [headers={}] - Additional headers for the request.
     * @returns {Promise<string>} - Text/HTML content.
     */
    getText(url_1) {
        return __awaiter$7(this, arguments, void 0, function* (url, headers = {}) {
            return this.fetchText(url, "GET", null, Object.assign({ Accept: "text/plain" }, headers));
        });
    },
    /**
     * Sends raw text via POST.
     * @param {string} url - Target URL.
     * @param {string} data - Text to be sent.
     * @param {Record<string, string>} [headers={}] - Additional headers for the request.
     * @returns {Promise<string>} - Server response text.
     */
    postText(url_1, data_1) {
        return __awaiter$7(this, arguments, void 0, function* (url, data, headers = {}) {
            return this.fetchData(url, "POST", data, Object.assign({ "Content-Type": "text/plain" }, headers));
        });
    },
    /**
     * Updates text data via PUT.
     * @param {string} url - Target URL.
     * @param {string} data - Text to be sent.
     * @param {Record<string, string>} [headers={}] - Additional headers for the request.
     * @returns {Promise<string>} - Server response text.
     */
    putText(url_1, data_1) {
        return __awaiter$7(this, arguments, void 0, function* (url, data, headers = {}) {
            return this.fetchData(url, "PUT", data, Object.assign({ "Content-Type": "text/plain" }, headers));
        });
    },
    /**
     * Deletes a resource via DELETE and returns the response text.
     * @param {string} url - Target URL.
     * @param {Record<string, string>} [headers={}] - Additional headers for the request.
     * @returns {Promise<string>} - The response text or an error message.
     */
    deleteText(url_1) {
        return __awaiter$7(this, arguments, void 0, function* (url, headers = {}) {
            return this.fetchText(url, "DELETE", null, headers);
        });
    },
    /**
     * Generic method for fetching and sending JSON data.
     * @param {string} url - The API or resource URL.
     * @param {string} method - HTTP method (GET, POST, PUT, DELETE).
     * @param {unknown} [data=null] - JSON data to be sent.
     * @param {Record<string, string>} [headers={}] - Additional headers for the request.
     * @returns {Promise<any>} - Parsed JSON response.
     */
    fetchData(url_1, method_1) {
        return __awaiter$7(this, arguments, void 0, function* (url, method, data = null, headers = {}) {
            try {
                const response = yield fetch(url, {
                    method,
                    headers,
                    body: data ? JSON.stringify(data) : null,
                });
                if (!response.ok) {
                    throw new Error(`Error (${method}): ${response.status} – ${response.statusText}`);
                }
                // 🔹 Check if the response contains JSON before calling `response.json()`
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    return yield response.json();
                }
                else {
                    logger.warn(`API Warning: Response from ${url} is not JSON, returning as text.`);
                    return yield response.text(); // Return text if it's not JSON
                }
            }
            catch (err) {
                logger.error(`API Error at ${method} request to ${url}`, err);
                throw err;
            }
        });
    },
    /**
     * Generic method for fetching and sending text data.
     * @param {string} url - The API or resource URL.
     * @param {string} method - HTTP method (GET, POST, PUT, DELETE).
     * @param {string | null} [data=null] - Text data to be sent.
     * @param {Record<string, string>} [headers={}] - Additional headers for the request.
     * @returns {Promise<string>} - The response text.
     */
    fetchText(url_1, method_1) {
        return __awaiter$7(this, arguments, void 0, function* (url, method, data = null, headers = {}) {
            try {
                const response = yield fetch(url, {
                    method,
                    headers,
                    body: data,
                });
                if (!response.ok) {
                    throw new Error(`Error (${method}): ${response.status} – ${response.statusText}`);
                }
                return yield response.text();
            }
            catch (err) {
                logger.error(`Error at ${method} request for text `, err);
                throw err;
            }
        });
    },
};

/**
 * @fileoverview UI module for EltheonJS, providing utility functions for DOM manipulation and user interface interaction.
 * @module ui
 */
/**
 * Wrapper class for a DOM element with chainable methods for common DOM operations.
 */
class DomElement {
    /**
     * Creates a DomElement instance wrapping a DOM element.
     * @param {Element} element - The DOM element to be wrapped.
     */
    constructor(element) {
        this.element = element;
    }
    /**
   * Sets the text content of the element.
   * @param {string} text - The text to set.
   * @returns {DomElement} The DomElement object for chaining.
   */
    setText(text) {
        this.element.textContent = text;
        return this;
    }
    /**
     * Sets the inner HTML of the element.
     * @param {string} html - The HTML string to set.
     * @returns {DomElement} The DomElement object for chaining.
     */
    setHTML(html) {
        this.element.innerHTML = html;
        return this;
    }
    /**
     * Sets the value of an element depending on its type:
     * - For input and textarea elements, the `value` property is set.
     * - For other elements, `textContent` is set.
     * @param {string} value - The value to set.
     * @returns {this} The current UI object for chaining.
     */
    setValue(value) {
        if (this.element instanceof HTMLInputElement || this.element instanceof HTMLTextAreaElement) {
            this.element.value = value;
        }
        else if (this.element instanceof HTMLSelectElement) {
            const optionExists = Array.from(this.element.options).some(opt => opt.value === value);
            if (optionExists) {
                this.element.value = value;
            }
            else {
                console.warn(`setValue: Value '${value}' not present in <select>.`);
            }
        }
        else {
            this.element.textContent = value;
        }
        return this;
    }
    /**
     * Retrieves the current value of an element depending on its type:
     * - For input and textarea elements, the `value` property is returned.
     * - For other elements, `textContent` is returned.
     * @returns {string} The value of the element or an empty string if the element has no value.
     */
    getValue() {
        if (this.element instanceof HTMLInputElement || this.element instanceof HTMLTextAreaElement || this.element instanceof HTMLSelectElement) {
            return this.element.value;
        }
        else if (this.element.textContent !== null) {
            return this.element.textContent;
        }
        return "";
    }
    /**
     * Replaces `{{key}}` placeholders within the element with specified values.
     *
     * @param {Record<string, any>} values - An object containing key-value pairs for the placeholders (`{{key}}`).
     */
    setTemplate(values) {
        this.element.innerHTML = this.element.innerHTML.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] || "");
    }
    /**
     * Replaces a specific `{{key}}` placeholder within the element with a new value.
     *
     * @param {string} key - The name of the placeholder to replace.
     * @param {string} value - The new value for the placeholder.
     */
    setTemplateValue(key, value) {
        this.element.innerHTML = this.element.innerHTML.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
    /**
     * Enables the current DOM element by removing the `disabled` attribute or the `disabled` class.
     * Useful for form elements like buttons and input fields.
     */
    enable() {
        if (this.element instanceof HTMLInputElement || this.element instanceof HTMLButtonElement) {
            this.element.disabled = false;
        }
        else {
            this.element.classList.remove("disabled");
        }
    }
    /**
     * Disables the current DOM element by setting the `disabled` attribute or adding the `disabled` class.
     * Useful for buttons and form elements to prevent interaction.
     */
    disable() {
        if (this.element instanceof HTMLInputElement || this.element instanceof HTMLButtonElement) {
            this.element.disabled = true;
        }
        else {
            this.element.classList.add("disabled");
        }
    }
    /**
     * Adds a CSS class to the element.
     * @param {string} className - The class name to add.
     * @returns {DomElement} The DomElement object for chaining.
     */
    addClass(className) {
        this.element.classList.add(className);
        return this;
    }
    /**
     * Removes a CSS class from the element.
     * @param {string} className - The class name to remove.
     * @returns {DomElement} The DomElement object for chaining.
     */
    removeClass(className) {
        this.element.classList.remove(className);
        return this;
    }
    /**
     * Toggles a CSS class for the element.
     * @param {string} className - The class name to toggle.
     * @returns {DomElement} The DomElement object for chaining.
     */
    toggleClass(className) {
        this.element.classList.toggle(className);
        return this;
    }
    /**
     * Removes all child elements from the current element.
     * @returns {this} The current instance for chaining.
     */
    empty() {
        while (this.element.firstChild) {
            this.element.removeChild(this.element.firstChild);
        }
        return this;
    }
    /**
     * Adds an event listener to the element.
     * @param {string} event - The event type to listen for.
     * @param {Function} handler - The function to execute when the event is triggered.
     * @returns {DomElement} The DomElement object for chaining.
     */
    on(event, handler) {
        this.element.addEventListener(event, handler);
        return this;
    }
    /**
     * Removes an event listener from the element.
     * @param {string} event - The event type.
     * @param {Function} handler - The function that was added as a listener.
     * @returns {DomElement} The DomElement object for chaining.
     */
    off(event, handler) {
        this.element.removeEventListener(event, handler);
        return this;
    }
    /**
     * Sets an attribute for the element.
     * @param {string} attr - The attribute name.
     * @param {string} value - The value to set for the attribute.
     * @returns {DomElement} The DomElement object for chaining.
     */
    setAttribute(attr, value) {
        this.element.setAttribute(attr, value);
        return this;
    }
    /**
     * Gets the value of an attribute of the element.
     * @param {string} attr - The attribute name.
     * @returns {string|null} The attribute value or null if not found.
     */
    getAttribute(attr) {
        return this.element.getAttribute(attr);
    }
    /**
   * Selects the first element that matches a CSS selector within the current element.
   * @param {string} selector - The CSS selector.
   * @returns {DomElement} A DomElement object representing the selected element.
   */
    get(selector) {
        const foundElement = this.element.querySelector(selector);
        return foundElement ? new DomElement(foundElement) : null;
    }
    /**
     * Selects all elements that match a CSS selector within the current element.
     * Returns a proxy that automatically applies methods to all found elements.
     * @param {string} selector - The CSS selector.
     * @returns {Proxy} A proxy list that applies methods to all selected elements.
     */
    getAll(selector) {
        const elements = Array.from(this.element.querySelectorAll(selector)).map(el => new DomElement(el));
        return new Proxy(elements, {
            get(target, prop, receiver) {
                var _a;
                if (typeof ((_a = target[0]) === null || _a === void 0 ? void 0 : _a[prop]) === "function") {
                    return (...args) => {
                        target.forEach(el => el[prop](...args)); // Apply function to all elements
                        return receiver; // Enable method chaining
                    };
                }
                return Reflect.get(target, prop, receiver);
            }
        });
    }
    /**
     * Creates and appends a new child element to this element.
     * @param {string} tagName - The tag name of the element to create (e.g., 'div', 'span').
     * @param {string} [text=""] - Optional text content for the element.
     * @returns {DomElement} A DomElement object representing the newly created child element.
     */
    create(tagName, text = "") {
        const childElement = document.createElement(tagName);
        if (text)
            childElement.textContent = text;
        this.element.appendChild(childElement);
        return new DomElement(childElement);
    }
    /**
     * Appends an existing DomElement object as a child to this element.
     * @param {DomElement} child - The DomElement object to append.
     * @returns {DomElement} The current DomElement object for chaining.
     */
    append(child) {
        this.element.appendChild(child.element);
        return this;
    }
    /**
     * Removes this element from the DOM.
     */
    remove() {
        var _a;
        (_a = this.element.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(this.element);
    }
    /**
     * Hides the element.
     * @returns {this} The current instance for chaining.
     */
    hide() {
        this.element.style.display = "none";
        return this;
    }
    /**
     * Shows the element.
     * @returns {this} The current instance for chaining.
     */
    show() {
        this.element.style.display = "";
        return this;
    }
    /**
     * Toggles the visibility of the element.
     * @returns {this} The current instance for chaining.
     */
    toggle() {
        this.element.style.display = this.element.style.display === "none" ? "" : "none";
        return this;
    }
}
/**
 * UI module for DOM manipulation and user interaction.
 * @namespace ui
 */
const ui = {
    /**
     * Searches for a single element and returns it as a `DomElement`.
     * @param {string} selector - The CSS selector of the element.
     * @param {Element | Document} [context=document] - The context in which to search.
     * @returns {DomElement | null} - The found element as a `DomElement`, or `null` if not found.
     */
    get: (selector, context = document) => context.querySelector(selector) ? new DomElement(context.querySelector(selector)) : null,
    /**
     * Searches for all matching elements and returns a proxy list that automatically applies methods to all.
     *
     * @template {keyof DomElement} K
     * @param {string} selector - The CSS selector of the elements.
     * @param {Element | Document} [context=document] - The context in which to search.
     * @returns {DomElement[]} - A proxy list that applies methods automatically to all found elements.
     */
    getAll: (selector, context = document) => {
        const elements = Array.from(context.querySelectorAll(selector)).map(el => new DomElement(el));
        return new Proxy(elements, {
            get(target, prop, receiver) {
                var _a;
                if (typeof ((_a = target[0]) === null || _a === void 0 ? void 0 : _a[prop]) === "function") {
                    return (...args) => {
                        target.forEach(el => el[prop](...args));
                        return receiver; // Erlaubt Method-Chaining
                    };
                }
                return Reflect.get(target, prop, receiver);
            }
        }); // ⚡ Typ-Cast für IntelliSense
    }
};

/**
 * @fileoverview Module for dynamic data binding in EltheonJS.
 * @module bind
 */
/**
 * Bind module for reactive data binding.
 * @namespace bind
 */
const bind = {
    /**
     * `applyBindings` can now directly accept a normal (non-reactive) model.
     * It is automatically converted to a reactive model and stored.
     *
     * @param {object | any[]} rawModel - The model (not yet reactive or already reactive).
     * @param {string | DomElement | TemplateElement} [root="body"] - CSS selector (default: "body"), a DomElement, or a TemplateElement.
     * @returns {object} The reactive model (Proxy).
     */
    applyBindings(rawModel, root = "body") {
        const model = this.createReactiveModel(rawModel);
        let rootElement = null;
        if (typeof root === "string") {
            rootElement = document.querySelector(root);
        }
        else if (typeof root === "object" && root !== null && "element" in root) {
            rootElement = root.element;
        }
        if (!rootElement) {
            console.warn("applyBindings: Invalid data-bind format.");
            return model;
        }
        const elements = rootElement.querySelectorAll("[data-bind]");
        elements.forEach((el) => {
            var _a;
            const bindingAttr = (_a = el.getAttribute("data-bind")) === null || _a === void 0 ? void 0 : _a.trim();
            if (!bindingAttr)
                return;
            const [bindType, propPath] = bindingAttr.split(":").map((s) => s.trim());
            if (!bindType || !propPath) {
                console.warn("applyBindings: Invalid data-bind format.");
                return;
            }
            switch (bindType) {
                case "text":
                    this.bindText(el, model, propPath);
                    break;
                case "value":
                    this.bindValue(el, model, propPath);
                    break;
                case "foreach":
                    this.bindForeach(el, model, propPath);
                    break;
                default:
                    console.warn("Unknown binding:", bindType);
            }
        });
        return model;
    },
    /**
     * Attempts to retrieve a deeply nested property from the reactive model.
     *
     * @param {string} propertyPath - The property path, e.g., "n4.t1".
     * @param {object} model - The reactive model.
     * @returns {any} The value of the property, or `undefined` if not found.
     */
    resolvePropertyPath(propertyPath, model) {
        if (!model || !propertyPath)
            return undefined;
        const parts = propertyPath.split(".");
        let current = model;
        for (let i = 0; i < parts.length; i++) {
            if (!current)
                return undefined;
            current = current[parts[i]];
        }
        return current;
    },
    /**
     * Implements a simple `foreach` binding.
     * - Reads child nodes as a template.
     * - Removes them from the DOM.
     * - Duplicates them for each element in the array.
     * - Binds them to the corresponding path (e.g., `myArray.0`, `myArray.1`, ...).
     * - If the array changes (e.g., via `push/pop` or reassigning the `propertyPath`),
     *   the UI is re-rendered accordingly.
     * NOTE: Dynamic `push/splice` changes in the array require the proxy trap.
     *
     * @param {HTMLElement} element - The container element.
     * @param {object} model - The reactive model.
     * @param {string} arrayPath - The path to the array in the model.
     */
    bindForeach(element, model, arrayPath) {
        if (!element || !model || !arrayPath) {
            logger.error("bindForeach: Invalid parameters.");
            return;
        }
        const templateNodes = Array.from(element.childNodes);
        element.innerHTML = "";
        const render = () => {
            element.innerHTML = "";
            const arr = this.resolvePropertyPath(arrayPath, model);
            if (!Array.isArray(arr))
                return;
            arr.forEach((item, index) => {
                const clones = templateNodes.map((node) => node.cloneNode(true));
                clones.forEach((cloneNode) => element.appendChild(cloneNode));
                clones.forEach((cloneNode) => {
                    this.applyBindingsToNode(cloneNode, model, arrayPath + "." + index);
                });
            });
        };
        render();
        if (!model.modelCallbacks)
            model.modelCallbacks = {};
        if (!model.modelCallbacks[arrayPath]) {
            model.modelCallbacks[arrayPath] = [];
        }
        model.modelCallbacks[arrayPath].push(() => {
            render();
        });
        // 🔹 **Sicherstellen, dass `arr` ein Array ist, bevor Methoden überschrieben werden**
        const arr = this.resolvePropertyPath(arrayPath, model);
        if (!Array.isArray(arr)) {
            console.warn(`⚠️ bindForeach: ${arrayPath} is not an array. Methods will not be overridden.`);
            return;
        }
        const methods = ["push", "splice", "unshift"];
        methods.forEach((method) => {
            if (typeof Array.prototype[method] === "function") { // 🔹 Wir greifen auf den Prototyp zu
                const originalMethod = Array.prototype[method];
                Object.defineProperty(arr, method, {
                    value: function (...args) {
                        const result = originalMethod.apply(this, args); // Original `push` / `splice` / `unshift` aufrufen
                        render(); // UI neu rendern
                        return result;
                    },
                    writable: true, // Jetzt überschreibbar
                    configurable: true, // Damit es später geändert oder entfernt werden kann
                });
            }
            else {
                console.warn(`⚠️ bindForeach: ${String(method)} is not a valid method for ${arrayPath}.`);
            }
        });
    },
    /**
     * Binds the text content of an element to a nested property of the reactive model.
     *
     * @param {HTMLElement} element - The target DOM element.
     * @param {object} model - The reactive model.
     * @param {string} propertyPath - The property path, e.g., "n4.t1".
     */
    bindText(element, model, propertyPath) {
        if (!element || !model || !propertyPath) {
            logger.error("bindText: Invalid parameters.");
            return;
        }
        if (!model.modelCallbacks) {
            model.modelCallbacks = {};
        }
        if (!model.modelCallbacks[propertyPath]) {
            model.modelCallbacks[propertyPath] = [];
        }
        const updateText = (newVal) => {
            if (element.textContent !== newVal) {
                element.textContent = newVal;
            }
        };
        model.modelCallbacks[propertyPath].push(updateText);
        // Initial: hole aktuellen Wert
        const initialVal = this.resolvePropertyPath(propertyPath, model);
        updateText(initialVal);
    },
    /**
     * Binds the value of an input element to a nested property.
     * This ensures that changes made by the user update the model,
     * and updates to the model reflect in the UI.
     *
     * @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} element - The input element.
     * @param {object} model - The reactive model.
     * @param {string} propertyPath - The property path, e.g., "n4.t1".
     */
    bindValue(element, model, propertyPath) {
        if (!element || !model || !propertyPath) {
            logger.error("bindValue: Invalid parameters.");
            return;
        }
        if (!model.modelCallbacks) {
            model.modelCallbacks = {};
        }
        if (!model.modelCallbacks[propertyPath]) {
            model.modelCallbacks[propertyPath] = [];
        }
        // Wenn der Benutzer tippt => aktualisiere das Modell
        const updateModel = () => {
            bind.setPropertyValue(model, propertyPath, element.value);
        };
        // Wenn sich das Modell ändert => aktualisiere das Eingabefeld
        const updateElement = (newVal) => {
            if (element.value !== newVal) {
                element.value = newVal;
            }
        };
        element.addEventListener("input", updateModel);
        model.modelCallbacks[propertyPath].push(updateElement);
        // Initial setzen
        const initialVal = this.resolvePropertyPath(propertyPath, model);
        updateElement(initialVal);
    },
    /**
     * Applies bindings only within a specific DOM subtree.
     * - `data-bind="text: X"` / `value: X` bindings interpret `X` relative to the prefix.
     * - Example: "text: property" becomes "myArray.0.property".
     *
     * @param {HTMLElement} domNode - The root node where bindings should be applied.
     * @param {object} model - The reactive model.
     * @param {string} prefix - The base path for binding, e.g., "myArray.0".
     */
    applyBindingsToNode(domNode, model, prefix) {
        if (!domNode.querySelectorAll) {
            // Falls es kein Elementknoten ist
            return;
        }
        // Auch der Knoten selbst könnte data-bind besitzen
        const toProcess = domNode.matches("[data-bind]") ? [domNode] : [];
        // plus alle Kindknoten
        const children = domNode.querySelectorAll("[data-bind]");
        toProcess.push(...Array.from(children).map(child => child));
        toProcess.forEach((el) => {
            var _a;
            const bindingAttr = (_a = el.getAttribute("data-bind")) === null || _a === void 0 ? void 0 : _a.trim();
            if (!bindingAttr)
                return;
            const [bindTypeRaw, propPathRaw] = bindingAttr.split(":");
            if (!bindTypeRaw || !propPathRaw) {
                console.warn("applyBindingsToNode: Invalid data-bind format.");
                return;
            }
            const bindType = bindTypeRaw.trim();
            const localPath = propPathRaw.trim();
            // Merge Pfade => prefix + '.' + localPath
            const fullPath = prefix + '.' + localPath;
            switch (bindType) {
                case "text":
                    this.bindText(el, model, fullPath);
                    break;
                case "value":
                    this.bindValue(el, model, fullPath);
                    break;
                // foreach in foreach? Ausbaufähig. :)
                default:
                    console.warn("applyBindingsToNode: Unknown binding:", bindType);
            }
        });
    },
    /**
     * Sets a deeply nested property and triggers all registered `modelCallbacks`.
     *
     * @param {object} model - The reactive model.
     * @param {string} propertyPath - The property path, e.g., "n4.t1".
     * @param {any} value - The new value to set.
     */
    setPropertyValue(model, propertyPath, value) {
        if (!model || !propertyPath)
            return;
        const parts = propertyPath.split(".");
        let current = model;
        // Wir laufen durch alle bis auf das letzte.
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            // Falls nicht existiert, erzeugen wir ein reaktives Subobjekt
            if (!current[part]) {
                current[part] = this.createReactiveModel({}, model, parts.slice(0, i + 1).join("."));
            }
            current = current[part];
        }
        const lastPart = parts[parts.length - 1];
        current[lastPart] = value;
        // Callback auslösen
        if (model.modelCallbacks && model.modelCallbacks[propertyPath]) {
            model.modelCallbacks[propertyPath].forEach((cb) => cb(value));
        }
    },
    /**
     * Registers a callback for a specific property of a model or sub-object.
     * The callback is executed whenever the property changes.
     *
     * @param {object} model - The target model or object.
     * @param {string} propertyPath - The property to observe.
     * @param {Function} callback - The function to be called when the property changes.
     */
    registerModelCallback(model, propertyPath, callback) {
        // Stelle sicher, dass das Modell existiert und die Callback-Array initialisiert ist.
        if (!model.modelCallbacks) {
            model.modelCallbacks = {};
        }
        if (!model.modelCallbacks[propertyPath]) {
            model.modelCallbacks[propertyPath] = [];
        }
        // Füge den Callback zur Liste der Callbacks für diese Eigenschaft hinzu.
        model.modelCallbacks[propertyPath].push(callback);
    },
    /**
     * Helper function to create a reactive proxy model.
     * - Tracks the "full path" (`basePath`) to ensure correct callback resolution.
     * - Example: `obj.n4.t1 = "Test"` correctly identifies "n4.t1"
     *   and invokes the appropriate callbacks.
     *
     * @param {object} model - The original (partial) object.
     * @param {object} [root=null] - Reference to the "root model" where `modelCallbacks` are stored.
     * @param {string} [basePath=""] - The accumulated property path.
     * @param {Function} [onAnyChange] - Optional callback for any change in the model.
     * @returns {Proxy} A reactive proxy object.
     */
    createReactiveModel(model, root = null, basePath = "", onAnyChange) {
        // Wenn es schon reaktiv ist, zurückgeben
        if (model && model.__isReactive) {
            return model;
        }
        // root ist das Modell, das die modelCallbacks enthält
        if (!root) {
            root = model;
            if (!root.modelCallbacks) {
                root.modelCallbacks = {};
            }
        }
        // Markiere das Originalobjekt
        model.__isReactive = true;
        const proxy = new Proxy(model, {
            get(target, property) {
                const val = target[property];
                // Falls es sich um eine Array-Methode handelt, rufe sie normal auf
                if (typeof val === "function" && Array.isArray(target)) {
                    return function (...args) {
                        const result = val.apply(target, args); // Original-Methode ausführen
                        // Falls `push`, `unshift` oder `splice` verwendet wurde, proxifizieren
                        if (["push", "unshift", "splice"].includes(property.toString())) {
                            target.forEach((item, index) => {
                                if (typeof item === "object" && item !== null && !item.__isReactive) {
                                    target[index] = bind.createReactiveModel(item, root, `${basePath}.${index}`);
                                }
                            });
                        }
                        return result;
                    };
                }
                // Falls wir auf verschachtelte Objekte/Arrays zugreifen, diese reaktiv machen
                if (typeof val === "object" && val !== null && !val.__isReactive) {
                    // Prüfen, ob wir das root-Element selbst referenzieren (Vermeidung von Endlosschleifen)
                    if (val === root) {
                        console.warn(`⚠️ Self-reference detected at ${basePath}.${String(property)} - not proxifying!`);
                        return val; // Verhindere Rekursion
                    }
                    // Pfad berechnen
                    const nextPath = basePath ? `${basePath}.${String(property)}` : String(property);
                    target[property] = bind.createReactiveModel(val, root, nextPath);
                }
                return target[property];
            },
            set(target, property, value) {
                var _a;
                // Prüfe, ob wir eine Endlosschleife verursachen könnten
                if (value === target) {
                    console.warn(`⚠️ Self-assignment prevented for ${basePath}.${String(property)}`);
                    return true; // Verhindere die Schleife
                }
                target[property] = value;
                target.__isReactive = true;
                // Vollen Pfad berechnen => z.B. basePath = "n4", property = "t1" => "n4.t1"
                const fullPath = basePath ? `${basePath}.${String(property)}` : String(property);
                // Callbacks für das Feld
                const cbs = (_a = root.modelCallbacks) === null || _a === void 0 ? void 0 : _a[fullPath];
                if (Array.isArray(cbs)) {
                    cbs.forEach((cb) => cb(value));
                }
                // NEU: Top-Level-Callback aufrufen
                if (onAnyChange) {
                    onAnyChange(fullPath, value);
                }
                // Sicherstellen, dass Callbacks existieren und ein Array sind
                if (bind.updateBindings) {
                    bind.updateBindings(fullPath, value);
                }
                return true;
            },
        });
        proxy.__isReactive = true;
        return proxy;
    },
    /**
     * Called within the proxy when a change occurs.
     *
     * @param {string} fullPath - The full property path, e.g., "n4.t1".
     * @param {any} newValue - The new value of the property.
     */
    updateBindings(fullPath, newValue) {
        // console.log("[updateBindings] Pfad=", fullPath, "Value=", newValue);
    },
};

/**
 * @fileoverview Module for HTML templating in EltheonJS.
 * @module templating
 */
/**
 * @typedef {Object.<string, function(Event, DomElement): void>} EventMap
 * An object containing event handlers linked via `data-tpl-event`.
 */
/**
 * An extended version of DomElement for templates.
 * Supports additional attributes like `data-tpl-key`, `{{key}}` placeholders, and `data-tpl-if`.
 * @class
 * @extends DomElement
 * @see ui.DomElement
 */
class TemplateElement extends DomElement {
    constructor(element) {
        super(element);
    }
    /**
     * Applies template data:
     * - `data-tpl-key` for specific values in elements.
     * - `{{key}}` for HTML placeholders.
     * - `data-tpl-if` for conditional element display.
     * - `data-tpl-event` for automatic event binding.
     * - `data-tpl-foreach` for repeated elements.
     *
     * @param {Record<string, any>} values - Key-value object for placeholder values.
     * @param {EventMap} [eventMap] - Optional event handlers for `data-tpl-event`.
     */
    applyTemplate(values, eventMap) {
        // 1️⃣ `data-tpl-foreach` verarbeiten
        this.getAll("[data-tpl-foreach]").forEach((foreachEl) => {
            const key = foreachEl.getAttribute("data-tpl-foreach") || "";
            const list = values[key];
            if (Array.isArray(list)) {
                const parent = foreachEl.element.parentElement;
                foreachEl.remove(); // Entfernt das Original-Element
                list.forEach((item) => {
                    const cloneItem = foreachEl.element.cloneNode(true);
                    const itemEl = new TemplateElement(cloneItem);
                    // Wende die Template-Daten für jedes Item an
                    itemEl.applyTemplate(item, eventMap);
                    parent === null || parent === void 0 ? void 0 : parent.appendChild(cloneItem);
                });
            }
        });
        // 2️⃣ `data-tpl-key` ersetzen
        this.getAll("[data-tpl-key]").forEach((tplEl) => {
            const key = tplEl.getAttribute("data-tpl-key") || "";
            if (key && values[key] !== undefined) {
                tplEl.setText(values[key]);
            }
        });
        // 3️⃣ `{{key}}` Platzhalter im HTML ersetzen
        this.setTemplate(values);
        // 4️⃣ `data-tpl-if` prüfen und Elemente ausblenden/löschen
        this.getAll("[data-tpl-if]").forEach((tplEl) => {
            const key = tplEl.getAttribute("data-tpl-if") || "";
            if (!values[key]) {
                tplEl.remove(); // Element entfernen, wenn Bedingung nicht erfüllt
            }
        });
        // 5️⃣ Falls `eventMap` übergeben wurde, Events binden
        if (eventMap) {
            this.getAll("[data-tpl-event]").forEach((tplEl) => {
                var _a;
                const [eventType, handlerName] = ((_a = tplEl.getAttribute("data-tpl-event")) === null || _a === void 0 ? void 0 : _a.split(":")) || [];
                if (eventType && handlerName && eventMap[handlerName]) {
                    tplEl.on(eventType, (e) => eventMap[handlerName](e, tplEl));
                }
            });
        }
    }
}
/**
 * The templating class allows working with HTML templates.
 * @class
 * @classdesc Allows working with dynamically generated templates using attributes like `data-tpl-key` and `data-tpl-if`.
 * @exports Templating
 */
class Templating {
    constructor() {
        /**
         * Stores all recognized templates based on the `data-tpl` attribute.
         * @private
         * @type {Record<string, TemplateElement>}
         */
        this.templates = {};
    }
    /**
     * Initializes the templating module by collecting all elements with `data-tpl`
     * from the DOM and storing them as clones.
     */
    init() {
        const templateNodes = document.querySelectorAll("[data-tpl]");
        templateNodes.forEach((node) => {
            const name = node.getAttribute("data-tpl");
            if (name) {
                const cloned = new TemplateElement(node.cloneNode(true));
                node.remove();
                this.templates[name] = cloned;
            }
        });
    }
    /**
     * Renders a template as a new TemplateElement by cloning it.
     * Supports:
     * - `data-tpl-key="name"` for specific values in elements.
     * - `{{key}}` for dynamic HTML placeholders.
     * - `data-tpl-if="isActive"` for conditional element display.
     * - `data-tpl-event="click:joinGame"` for event bindings.
     * - `data-tpl-foreach="games"` for repeating lists.
     *
     * @param {string} templateName - The name of the template.
     * @param {Record<string, any>} [values={}] - Key-value object for placeholders.
     * @param {EventMap} [eventMap] - Optional event handlers for `data-tpl-event`.
     * @returns {TemplateElement | null} - A newly created TemplateElement or `null` if the template is missing.
     *
     * @example
     * ```html
     * <div data-tpl="game-template">
     *   <h5 data-tpl-key="gameId">{{gameId}}</h5>
     *   <p>Status: {{gameStatus}}</p>
     *   <button data-tpl-event="click:joinGame">Join</button>
     * </div>
     * ```
     * ```ts
     * const gameCard = EltheonJS.templating.render("game-template", {
     *   gameId: "123",
     *   gameStatus: "Active"
     * }, {
     *   joinGame: (event, el) => {
     *     console.log("Joining game:", el.getText("gameId"));
     *   }
     * });
     * document.body.appendChild(gameCard.element);
     * ```
     */
    render(templateName, values = {}, eventMap) {
        const template = this.templates[templateName];
        if (!template) {
            logger.warn(`Templating: Template '${templateName}' not found.`);
            return new TemplateElement(document.createElement("div")).setText("Template not found.");
        }
        const clone = new TemplateElement(template.element.cloneNode(true));
        // Hier: Template-Namen setzen
        clone.templateName = templateName;
        clone.applyTemplate(values, eventMap);
        return clone;
    }
    /**
     * Renders a template and appends it to a container.
     *
     * @param {string} containerSelector - CSS selector for the target container.
     * @param {string} templateName - The name of the template.
     * @param {Record<string, any>} [values={}] - Data for template placeholders.
     *
     * @example
     * ```html
     * <div id="content"></div>
     * ```
     * ```ts
     * EltheonJS.templating.appendTo("#content", "user-card", {
     *   name: "Alex",
     *   description: "Game Developer",
     *   isActive: false
     * });
     * ```
     */
    appendTo(containerSelector, templateName, values = {}) {
        const container = ui.get(containerSelector);
        if (!container) {
            logger.warn(`Templating: Container '${containerSelector}' not found.`);
            return;
        }
        const element = this.render(templateName, values);
        if (element) {
            container.append(element);
        }
    }
}
/**
 * Singleton instance of the {@link Templating} class.
 * This instance is used globally within EltheonJS.
 *
 * @type {Templating}
 * @constant
 */
const templating = new Templating();

/**
 * @fileoverview Module for scheduled executions in EltheonJS (Scheduler).
 * @module scheduler
 */
class Scheduler {
    constructor() {
        this.intervals = new Map();
        this.intervalObjects = new Map();
    }
    /**
     * Generates a random GUID as a unique key.
     * @returns {string} A new GUID.
     */
    generateGUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
    /**
     * Calls `fn` every `ms` milliseconds and can be dynamically adjusted.
     * If only two parameters are provided, a GUID is automatically generated as the key.
     *
     * @param {string | number} keyOrMs - A unique key or the interval time in milliseconds.
     * @param {number | function} msOrFn - The interval time or the function to execute.
     * @param {function} [fn] - The function to execute (if the key is explicitly set).
     * @returns {IntervalObject | undefined} Control functions for the interval.
     */
    every(keyOrMs, msOrFn, fn) {
        let key, ms, callback;
        if (typeof keyOrMs === 'number' && typeof msOrFn === 'function') {
            key = this.generateGUID();
            ms = keyOrMs;
            callback = msOrFn;
        }
        else if (typeof keyOrMs === 'string' && typeof msOrFn === 'number' && typeof fn === 'function') {
            key = keyOrMs;
            ms = msOrFn;
            callback = fn;
        }
        else {
            console.warn("Scheduler: Invalid parameters for 'every()'. Usage: every(ms, fn) or every(key, ms, fn).");
            return;
        }
        if (this.intervals.has(key)) {
            console.warn(`Scheduler: Interval with key '${key}' already exists.`);
            return;
        }
        const execute = () => {
            try {
                callback();
            }
            catch (err) {
                logger.error(`Scheduler error in '${key}':`, err);
            }
        };
        const startInterval = () => setInterval(execute, ms);
        let intervalId = startInterval();
        let state = 'running';
        this.intervals.set(key, intervalId);
        const intervalObj = {
            /**
             * Stoppt das Intervall vollständig und entfernt es aus dem Scheduler.
             */
            stop: () => {
                if (this.intervals.has(key)) {
                    clearInterval(this.intervals.get(key));
                    this.intervals.delete(key);
                }
                this.intervalObjects.delete(key);
                state = 'stopped';
            },
            /**
             * Pausiert das Intervall, ohne es zu entfernen.
             */
            pause: () => {
                if (!this.intervals.has(key) || this.intervals.get(key) === null)
                    return;
                if (this.intervals.has(key) && state === 'running') {
                    clearInterval(this.intervals.get(key));
                    this.intervals.set(key, null);
                    state = 'paused';
                }
            },
            /**
             * Aktualisiert die Intervallzeit und startet das Intervall neu.
             * @param newMs Die neue Intervallzeit in Millisekunden.
             */
            update: (newMs) => {
                ms = newMs;
                if (state === 'running' || state === 'paused') {
                    if (this.intervals.has(key) && this.intervals.get(key) !== null) {
                        clearInterval(this.intervals.get(key));
                    }
                    intervalId = setInterval(execute, ms);
                    this.intervals.set(key, intervalId);
                    state = 'running';
                }
            },
            /**
             * Startet das Intervall neu, falls es pausiert oder gestoppt wurde.
             */
            start: () => {
                if (state === 'paused') {
                    intervalId = setInterval(execute, ms);
                    this.intervals.set(key, intervalId);
                    state = 'running';
                }
                else if (state === 'stopped') {
                    intervalId = startInterval();
                    this.intervals.set(key, intervalId);
                    state = 'running';
                }
            },
            /**
             * Gibt den aktuellen Status des Intervalls zurück.
             */
            get state() {
                return state;
            }
        };
        this.intervalObjects.set(key, intervalObj);
        return intervalObj;
    }
    /**
     * Returns the interval object with control methods.
     * @param {string} key - The key of the interval.
     * @returns {IntervalObject | undefined} The interval object or `undefined` if not found.
     */
    interval(key) {
        return this.intervalObjects.get(key);
    }
    /**
     * Stops an interval with a specific key and removes it from the scheduler.
     * @param {string} key - The key of the interval to stop.
     */
    stop(key) {
        if (this.intervals.has(key)) {
            clearInterval(this.intervals.get(key));
            this.intervals.delete(key);
            this.intervalObjects.delete(key);
            console.log(`Scheduler: Interval with key '${key}' has been stopped.`);
        }
        else {
            console.warn(`Scheduler: No interval found with key '${key}'.`);
        }
    }
    /**
     * Stops and removes all active intervals.
     */
    stopAll() {
        this.intervals.forEach((id) => {
            if (id !== null) {
                clearInterval(id);
            }
        });
        this.intervals.clear();
        this.intervalObjects.clear();
    }
}
const scheduler = new Scheduler();

var __awaiter$6 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * @fileoverview A wrapper module for SignalR that provides predefined hubs (Admin, User, Public).
 * Additional hubs can be added as needed.
 * @module realtime
 */
/**
 * @namespace realtime
 */
const realtime = {
    /**
     * Creates a new SignalR connection.
     * @function
     *
     * @param {string} hubUrl - Full URL to the hub, e.g., "/hubs/AdminHub".
     * @param {string} [accessToken] - Optional token for authentication.
     * @returns {Promise<signalR.HubConnection | null>} The established connection or `null` in case of an error.
     */
    createConnection(hubUrl, accessToken) {
        return __awaiter$6(this, void 0, void 0, function* () {
            if (!signalR) {
                logger.error("[realtime] SignalR is missing.", new Error("SignalR library is not available."));
                return null;
            }
            const connection = new signalR.HubConnectionBuilder()
                .withUrl(hubUrl, {
                accessTokenFactory: () => accessToken || "",
            })
                .withAutomaticReconnect()
                .build();
            try {
                yield connection.start();
                console.log(`[realtime] Connection established: ${hubUrl}`);
                return connection;
            }
            catch (err) {
                logger.error(`[realtime] Error establishing connection to ${hubUrl}`, err);
                throw err;
            }
        });
    },
    /**
     * Wrapper object for AdminHub.
     * @type {HubWrapper}
     */
    admin: createHubWrapper("/hub/admin"),
    /**
     * Wrapper object for UserHub.
     * @type {HubWrapper}
     */
    user: createHubWrapper("/hub/user"),
    /**
     * Wrapper object for PublicHub.
     * @type {HubWrapper}
     */
    public: createHubWrapper("/hub/public"),
};
/**
 * Creates a hub wrapper object with methods to start, register events, call methods, and stop.
 * @function
 *
 * @param {string} hubUrl - The URL of the SignalR hub.
 * @returns {HubWrapper} A wrapper object for the hub.
 */
function createHubWrapper(hubUrl) {
    return {
        /**
   * The SignalR connection.
   * @type {signalR.HubConnection | null}
   * @memberof HubWrapper
   */
        connection: null,
        /** Verbindung starten */
        /**
         * Starts the connection to the SignalR hub.
         * @function
         * @memberof HubWrapper
         * @param {string} [accessToken] - Optional authentication token.
         */
        start(accessToken) {
            return __awaiter$6(this, void 0, void 0, function* () {
                this.connection = yield realtime.createConnection(hubUrl, accessToken);
            });
        },
        /** Registriert einen Callback für ein Event. */
        /**
         * Registers an event handler for the SignalR hub.
         * @function
         * @memberof HubWrapper
         * @param {string} methodName - The name of the method to subscribe to.
         * @param {function} callback - The callback function that is called when the event is triggered.
         */
        on(methodName, callback) {
            if (this.connection) {
                this.connection.on(methodName, callback);
            }
            else {
                logger.error(`[realtime] Connection to ${hubUrl} is not active.`, new Error(`[realtime] No access to '${methodName}' - No connection.`));
            }
        },
        /** Ruft eine Methode auf */
        /**
         * Calls a method on the SignalR hub.
         * @function
         * @memberof HubWrapper
         * @param {string} methodName - The method to call.
         * @param {...any} args - The arguments passed to the method.
         * @returns {Promise<any>} A promise containing the method result.
         */
        invoke(methodName, ...args) {
            return __awaiter$6(this, void 0, void 0, function* () {
                if (!this.connection) {
                    const err = new Error(`[realtime] No access to '${methodName}' - No connection.`);
                    logger.error(`[realtime] Connection to ${hubUrl} is not active.`, err);
                    return Promise.reject(err);
                }
                try {
                    return yield this.connection.invoke(methodName, ...args);
                }
                catch (err) {
                    logger.error(`[realtime] Error in invoke('${methodName}')`, err);
                    throw err;
                }
            });
        },
        /** Verbindung stoppen */
        /**
         * Stops the connection to the SignalR hub.
         * @function
         * @memberof HubWrapper
         */
        stop() {
            return __awaiter$6(this, void 0, void 0, function* () {
                if (this.connection) {
                    try {
                        yield this.connection.stop();
                        console.log(`[realtime] Connection to ${hubUrl} closed.`);
                    }
                    catch (err) {
                        logger.error(`[realtime] Error stopping connection to ${hubUrl}`, err);
                        throw err;
                    }
                    finally {
                        this.connection = null;
                    }
                }
            });
        },
    };
}
/**
 * @namespace realtime
 * @typedef {Object} HubWrapper
 * @property {signalR.HubConnection | null} connection - The SignalR connection.
 * @property {function(string): Promise<void>} start - Starts the connection to the SignalR hub.
 * @property {function(string, function): void} on - Registers an event handler.
 * @property {function(string, ...any): Promise<any>} invoke - Calls a method on the hub.
 * @property {function(): Promise<void>} stop - Stops the connection.
 */

/**
 * Manages page logic based on the `data-page` attribute in the HTML structure.
 * Enables centralized control of JavaScript logic for each Razor Page.
 * @module pageManager
 * @version 1.0.0
 * @namespace pageManager
 */
/**
 * @class
 */
class PageManager {
    constructor() {
        this.pages = {};
    }
    /**
     * Registers logic for individual pages.
     * @param {Object.<string, function>} pages - An object with page names as keys and their respective functions.
  
     * @example
     * pageManager.registerPages({
     *   Home: () => console.log("Home page loaded"),
     *   Login: () => console.log("Login page loaded"),
     * });
     */
    registerPages(pages) {
        this.pages = Object.assign(Object.assign({}, this.pages), pages);
    }
    /**
     * Initializes the logic for the current page based on the `data-page` attribute in the HTML.
     * If no logic is found for the page or the attribute is missing, an error is logged.
     * @example
     * document.addEventListener("DOMContentLoaded", () => {
     *   pageManager.init();
     * });
     */
    init() {
        const pageName = document.body.dataset.page || document.documentElement.dataset.page;
        if (!pageName) {
            logger.error("PageManager: No data-page attribute found.");
            return;
        }
        const normalizedPageName = pageName.toLowerCase();
        if (this.pages[normalizedPageName]) {
            console.log(`PageManager: Loading logic for page "${normalizedPageName}"`);
            this.pages[normalizedPageName]();
        }
        else {
            logger.error(`PageManager: No logic registered for page "${normalizedPageName}"`);
        }
    }
}
// Singleton-Export für globalen Zugriff
const pageManager = new PageManager();
// Automatische Initialisierung nach dem DOM-Load
document.addEventListener("DOMContentLoaded", () => {
    //pageManager.init();
});

/**
 * Main library for Eltheon projects, serving as a central access point for various modules.
 * @module EltheonJSCore
 * @exports EltheonJS
 * @author Reemon Köppen
 * @version 2.0.0
 */
/**
 * Main object containing all modules for Eltheon projects.
 * @namespace EltheonCore
 */
const EltheonCore = {
    /**
     * Module for API communication.
     * @memberof EltheonJSCore
     */
    api,
    /**
     * UI handling and component management.
     * @memberof EltheonJS
     */
    ui,
    /**
     * Binding system for DOM elements.
     * @memberof EltheonJS
     */
    bind,
    /**
     * Task scheduler for scheduled actions.
     * @memberof EltheonJS
     */
    scheduler,
    /**
     * Template engine for dynamic content.
     * @memberof EltheonJS
     */
    templating,
    /**
     * Real-time handling with WebSockets or SignalR.
     * @memberof EltheonJS
     */
    realtime,
    /**
     * Logging.
     * @memberof EltheonJS
     */
    logger,
    /**
     * Page management and routing.
     * @memberof EltheonJS
     */
    pageManager,
};
if (typeof globalThis !== "undefined") {
    globalThis.EltheonJS = EltheonCore;
}
else if (typeof window !== "undefined") {
    window.EltheonJS = EltheonCore;
}

/**
 * @fileoverview Debugging module for EltheonJSFull.
 * This module is only available in EltheonJSFull and provides debugging utilities.
 * It allows tracking logs, API calls, SPA lifecycle events, routing, and other state changes.
 * @module debug
 */
var __awaiter$5 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Debugging module for EltheonJSFull.
 * @namespace debug
 */
const debug$1 = {
    /**
     * Indicates whether debug output is enabled globally.
     * @type {boolean}
     */
    enabled: false,
    /**
     * List of enabled debug scopes. If empty, all scopes are allowed.
     * @type {string[]}
     * @example
     * debug.scopes = ["spa", "api"]
     */
    scopes: [],
    /**
     * List of registered debug callbacks.
     * These will be triggered whenever a debug log occurs.
     * @type {DebugCallback[]}
     */
    callbacks: [],
    /**
     * Enables logging of API calls.
     * When enabled, all fetch requests will be intercepted and logged.
     * @type {boolean}
     */
    apiLogging: false,
    /**
     * Registers a callback for debug logs.
     * Callbacks will receive a standardized DebugEntry object.
     * @param {DebugCallback} callback - The callback function.
     */
    addCallback(callback) {
        this.callbacks.push(callback);
    },
    /**
     * Handles log messages and notifies registered callbacks.
     * Can be used from any module to trigger a debug output.
     * @param {string} scope - Logical area, e.g. "spa", "api", "state", "events".
     * @param {"info" | "debug" | "warn" | "error"} level - Log level.
     * @param {string} message - Message string.
     * @param {object} [data] - Optional attached data.
     */
    handleLog(scope, level, message, data) {
        if (!this.enabled)
            return;
        if (this.scopes.length && !this.scopes.includes(scope))
            return;
        const entry = {
            scope,
            level,
            message,
            data,
            timestamp: Date.now()
        };
        this.callbacks.forEach(cb => cb(entry));
    },
    /**
     * Enables API request logging by intercepting fetch calls.
     * All API requests using fetch will be logged to the debug system.
     */
    enableApiLogging() {
        if (this.apiLogging)
            return;
        this.apiLogging = true;
        const originalFetch = window.fetch;
        window.fetch = function (input, init) {
            return __awaiter$5(this, void 0, void 0, function* () {
                const response = yield originalFetch(input, init);
                // Debug-Logging wie gehabt:
                let responseBody;
                try {
                    responseBody = yield response.clone().json();
                }
                catch (_a) {
                    try {
                        responseBody = yield response.clone().text();
                    }
                    catch (_b) {
                        responseBody = null;
                    }
                }
                debug$1.handleLog("api", "debug", "API Call", {
                    url: (typeof input === "string" ? input : input instanceof Request ? input.url : ""),
                    method: (init === null || init === void 0 ? void 0 : init.method) || (input instanceof Request ? input.method : "GET"),
                    status: response.status,
                    response: responseBody
                });
                return response;
            });
        };
    }
};
// Automatically register debug module with LoggerDebugHelper (if available)
if (typeof (LoggerDebugHelper === null || LoggerDebugHelper === void 0 ? void 0 : LoggerDebugHelper.registerDebugModule) === "function") {
    LoggerDebugHelper.registerDebugModule(debug$1);
}

/**
 * Storage module for EltheonJS
 * Provides unified access to LocalStorage, SessionStorage, and IndexedDB
 * @module storage
 */
var __awaiter$4 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * @class StorageDriver
 * @classdesc Handles storage operations across different browser storage APIs
 * @method set - Stores a value in the selected storage type
 * @method get - Retrieves a value from the selected storage type
 * @method remove - Deletes a specific value from the selected storage type
 * @method clear - Clears all stored data in the selected storage type
 *
 * @namespace storage
 *
 * @private _initDB - Initializes IndexedDB storage
 * @private _setIndexedDB - Stores a value in IndexedDB
 * @private _getIndexedDB - Retrieves a value from IndexedDB
 * @private _removeIndexedDB - Removes a specific value from IndexedDB
 * @private _clearIndexedDB - Clears all stored data in IndexedDB
 */
class StorageDriver {
    constructor(type = "local") {
        /**
         * @property {string} dbName - Name of the IndexedDB database (default: "EltheonStorage")
         */
        this.dbName = "EltheonStorage";
        /**
         * @property {string} storeName - Name of the IndexedDB object store (default: "keyValueStore")*
         */
        this.storeName = "keyValueStore";
        this.dbInstance = null;
        this.type = type;
        if (type === "indexedDB") {
            this._initDB();
        }
    }
    /**
     * Stores a value in the specified storage with an optional expiration time.
     * @param {string} key - The key to store the value under.
     * @param {any} value - The value to be stored.
     * @param {number} [expiresInMs] - Optional expiration time in milliseconds. Default is infinite.
     */
    set(key, value, expiresInMs) {
        try {
            const data = { value, expires: expiresInMs ? Date.now() + expiresInMs : null };
            if (this.type === "local") {
                localStorage.setItem(key, JSON.stringify(data));
            }
            else if (this.type === "session") {
                sessionStorage.setItem(key, JSON.stringify(data));
            }
            else {
                this._setIndexedDB(key, data);
            }
            logger.info(`Storage set: ${key}`);
        }
        catch (error) {
            logger.error("Storage set failed", error);
        }
    }
    /**
     * Retrieves a value from the specified storage.
     * @param {string} key - The key to retrieve the value from.
     * @returns {Promise<any>} - The retrieved value, or null if not found or expired.
     */
    get(key) {
        return __awaiter$4(this, void 0, void 0, function* () {
            try {
                let item;
                if (this.type === "local") {
                    item = JSON.parse(localStorage.getItem(key) || "null");
                }
                else if (this.type === "session") {
                    item = JSON.parse(sessionStorage.getItem(key) || "null");
                }
                else {
                    item = yield this._getIndexedDB(key);
                }
                if (item && item.expires && Date.now() > item.expires) {
                    this.remove(key);
                    return null;
                }
                return (item === null || item === void 0 ? void 0 : item.value) || null;
            }
            catch (error) {
                logger.error("Storage get failed", error);
                return null;
            }
        });
    }
    /**
     * Remove an item from the specified storage.
     * @param {string} key - The key of the item to remove.
     * @returns {Promise<boolean>} - Returns `true` if removal was successful, `false` otherwise.
     */
    remove(key) {
        return __awaiter$4(this, void 0, void 0, function* () {
            try {
                if (this.type === "local") {
                    localStorage.removeItem(key);
                }
                else if (this.type === "session") {
                    sessionStorage.removeItem(key);
                }
                else {
                    return yield this._removeIndexedDB(key); // ✅ `await` hinzufügen
                }
                logger.info(`Storage removed: ${key}`);
                return true;
            }
            catch (error) {
                logger.error("Storage remove failed", error);
                return false;
            }
        });
    }
    /**
     * Clear all storage.
     * @returns {Promise<boolean>} - Returns `true` if the storage was cleared, `false` otherwise.
     */
    clear() {
        return __awaiter$4(this, void 0, void 0, function* () {
            try {
                if (this.type === "local") {
                    localStorage.clear();
                }
                else if (this.type === "session") {
                    sessionStorage.clear();
                }
                else {
                    return yield this._clearIndexedDB(); // ✅ `await` hinzufügen
                }
                logger.info("Storage cleared");
                return true;
            }
            catch (error) {
                logger.error("Storage clear failed", error);
                return false;
            }
        });
    }
    /**
     * Initialize IndexedDB
     */
    _initDB() {
        const request = indexedDB.open(this.dbName, 1);
        request.onerror = () => logger.error("IndexedDB initialization failed.");
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(this.storeName)) {
                db.createObjectStore(this.storeName, { keyPath: "key" });
            }
        };
    }
    /**
 * Retrieves an instance of IndexedDB for reuse.
 * This prevents unnecessary database openings and improves performance.
 * @private
 * @returns {Promise<IDBDatabase>}
 */
    _getDB() {
        return __awaiter$4(this, void 0, void 0, function* () {
            if (this.dbInstance)
                return this.dbInstance; // Falls schon vorhanden, direkt zurückgeben
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, 1);
                request.onsuccess = () => {
                    this.dbInstance = request.result;
                    resolve(this.dbInstance);
                };
                request.onerror = () => reject("Failed to open IndexedDB.");
            });
        });
    }
    /**
     * Set a value in IndexedDB
     * @private
     * @param {string} key - The key to store the value under.
     * @param {any} value - The value to be stored.
     * @returns {Promise<boolean>} - Returns `true` if removal was successful, `false` otherwise.
     */
    _setIndexedDB(key, value) {
        return __awaiter$4(this, void 0, void 0, function* () {
            try {
                const db = yield this._getDB();
                const transaction = db.transaction(this.storeName, "readwrite");
                const store = transaction.objectStore(this.storeName);
                store.put({ key, value });
                return new Promise((resolve) => {
                    transaction.oncomplete = () => {
                        logger.info(`Set IndexedDB entry: ${key}`);
                        resolve(true);
                    };
                    transaction.onerror = () => {
                        transaction.abort();
                        logger.error(`Failed to set IndexedDB entry: ${key}`);
                        resolve(false);
                    };
                });
            }
            catch (error) {
                logger.error(`Failed to set value in IndexedDB for key: ${key}`, error);
                return false;
            }
        });
    }
    /**
     * Get a value from IndexedDB
     * @param {string} key - The key to retrieve.
     * @returns {Promise<any>} - The retrieved value or null if not found.
     */
    _getIndexedDB(key) {
        return __awaiter$4(this, void 0, void 0, function* () {
            const db = yield this._getDB();
            return new Promise((resolve) => {
                const transaction = db.transaction(this.storeName, "readonly");
                const store = transaction.objectStore(this.storeName);
                const getRequest = store.get(key);
                getRequest.onsuccess = () => __awaiter$4(this, void 0, void 0, function* () {
                    const item = getRequest.result;
                    if ((item === null || item === void 0 ? void 0 : item.expires) && Date.now() > item.expires) {
                        yield this._removeIndexedDB(key); // Automatische Löschung, wenn abgelaufen
                        resolve(null);
                    }
                    else {
                        resolve((item === null || item === void 0 ? void 0 : item.value) || null);
                    }
                });
            });
        });
    }
    /**
     * Remove a value from IndexedDB.
     * @private
     * @param {string} key - The key to remove.
     * @returns {Promise<boolean>} - Returns `true` if removal was successful, `false` otherwise.
     */
    _removeIndexedDB(key) {
        return __awaiter$4(this, void 0, void 0, function* () {
            try {
                const db = yield this._getDB();
                const transaction = db.transaction(this.storeName, "readwrite");
                const store = transaction.objectStore(this.storeName);
                const request = store.delete(key);
                return new Promise((resolve) => {
                    request.onsuccess = () => {
                        logger.info(`Removed IndexedDB entry: ${key}`);
                        resolve(true);
                    };
                    request.onerror = () => {
                        logger.error(`Failed to remove IndexedDB entry: ${key}`);
                        resolve(false);
                    };
                });
            }
            catch (error) {
                logger.error(`Failed to remove value from IndexedDB for key: ${key}`, error);
                return false;
            }
        });
    }
    /**
     * Clear all data from IndexedDB.
     * @private
     * @returns {Promise<boolean>} - Returns `true` if the storage was cleared, `false` otherwise.
     */
    _clearIndexedDB() {
        return __awaiter$4(this, void 0, void 0, function* () {
            try {
                const db = yield this._getDB();
                const transaction = db.transaction(this.storeName, "readwrite");
                const store = transaction.objectStore(this.storeName);
                const request = store.clear();
                return new Promise((resolve) => {
                    request.onsuccess = () => {
                        logger.info("Cleared IndexedDB successfully.");
                        resolve(true);
                    };
                    request.onerror = () => {
                        logger.error("Failed to clear IndexedDB.");
                        resolve(false);
                    };
                });
            }
            catch (error) {
                logger.error("Failed to clear IndexedDB", error);
                return false;
            }
        });
    }
}
/**
 * Provides access to different storage drivers
 * @constant {Object} storage
 * @property {StorageDriver} local - Instance for LocalStorage management
 * @property {StorageDriver} session - Instance for SessionStorage management
 * @property {StorageDriver} indexedDB - Instance for IndexedDB management
 */
const storage = {
    local: new StorageDriver("local"),
    session: new StorageDriver("session"),
    indexedDB: new StorageDriver("indexedDB")
};

/**
 * EventBus for EltheonJS Full
 * Enables modular communication via events.
 * @module events
 */
/**
 * EventBus class providing a Pub/Sub mechanism for modular communication.
 * @class EventBus
 */
class EventBus {
    /**
     * Creates a new EventBus instance.
     * @constructor
     */
    constructor() {
        this.events = new Map();
    }
    /**
     * Registers a callback function for a specific event.
     * If the event does not exist, it is created.
     * @param {string} eventName - The name of the event.
     * @param {EventCallback} callback - The function to be called when the event is emitted.
     * @example
     * events.subscribe("data:loaded", (data) => console.log("Data loaded:", data));
     */
    subscribe(eventName, callback) {
        if (!eventName.trim()) {
            throw new Error("EventBus: Event name cannot be empty.");
        }
        if (typeof callback !== "function") {
            throw new Error(`EventBus: Callback for "${eventName}" must be a function.`);
        }
        if (!this.events.has(eventName)) {
            this.events.set(eventName, new Set());
        }
        this.events.get(eventName).add(callback);
        logger.info(`Event subscribed: ${eventName}`);
        debug$1.handleLog("events", "info", `Subscribed to event: ${eventName}`);
    }
    /**
     * Emits an event and calls all associated callback functions.
     * If no callback functions are registered, a warning is logged.
     *
     * @param {string} eventName - The name of the event.
     * @param {any} [data] - Optional data sent with the event.
     * @returns {EmitResult} - Returns an object containing event metadata and listener information.
     *
     * @example
     * const result = events.emit("data:loaded", { id: 1, value: "Test" });
     * if (!result.success) {
     *     console.warn(`No handlers for event: ${result.eventName}`);
     * } else {
     *     console.log(`Event processed by:`, result.listeners);
     * }
     */
    emit(eventName, data) {
        if (!eventName.trim()) {
            throw new Error("EventBus: Event name cannot be empty.");
        }
        const callbacks = this.events.get(eventName);
        if (!callbacks) {
            logger.warn(`Event "${eventName}" was emitted, but has no Listener.`);
            return { success: false, eventName, listeners: [], count: 0 };
        }
        logger.info(`Event emitted: ${eventName}`, data);
        debug$1.handleLog("events", "debug", `Event triggered: ${eventName}`, data);
        const listeners = [];
        for (const callback of callbacks) {
            listeners.push(callback.name || "anonymous"); // Falls der Callback keinen Namen hat
            callback(data);
        }
        return { success: listeners.length > 0, eventName, listeners, count: listeners.length };
    }
    /**
     * Removes a specific callback function or all listeners for an event.
     * If `callback` is not provided, all listeners for the event are removed.
     * If the event does not exist, nothing happens.
     * @param {string} eventName - The name of the event.
     * @param {EventCallback} [callback] - The specific callback function to remove (optional).
     * @returns {boolean} - Returns `true` if a listener was removed, `false` if the event did not exist or the callback was not found.
     * @example
     * events.unsubscribe("data:loaded", myFunction);
     * events.unsubscribe("data:loaded"); // Removes all listeners for the event
     */
    unsubscribe(eventName, callback) {
        var _a;
        if (!eventName.trim()) {
            throw new Error("EventBus: Event name cannot be empty.");
        }
        if (!this.events.has(eventName))
            return false;
        if (callback && !((_a = this.events.get(eventName)) === null || _a === void 0 ? void 0 : _a.has(callback))) {
            return false; // Falls der Callback nicht existiert, breche früh ab
        }
        if (callback) {
            const success = this.events.get(eventName).delete(callback);
            logger.info(`Event callback removed: ${eventName}`);
            debug$1.handleLog("events", "warn", `Callback removed from event: ${eventName}`);
            return success;
        }
        else {
            this.events.delete(eventName);
            logger.warn(`All listeners removed for event: ${eventName}`);
            debug$1.handleLog("events", "warn", `All listeners removed for event: ${eventName}`);
            return true;
        }
    }
    /**
     * Registers a one-time callback function for a specific event.
     * The function is automatically removed after the first execution.
     * @param {string} eventName - The name of the event.
     * @param {EventCallback} callback - The function to be executed once.
     * @example
     * events.once("user:loggedIn", (user) => console.log("User logged in once:", user));
     */
    once(eventName, callback) {
        const onceWrapper = (data) => {
            callback(data);
            this.unsubscribe(eventName, onceWrapper);
        };
        Object.defineProperty(onceWrapper, "name", { value: callback.name || "anonymous" }); // 💡 Fix
        this.subscribe(eventName, onceWrapper);
    }
}
/**
 * Global instance of the EventBus for use within EltheonJS Full.
 * @constant
 * @type {EventBus}
 */
const globalEventBus = new EventBus();

/**
 * @module cache
 * @namespace EltheonJS.cache
 * Provides a caching mechanism for API responses and templating.
 */
var __awaiter$3 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Universal cache class for EltheonJS.
 * Provides in-memory caching with optional expiration (TTL).
 * @class
 */
class Cache {
    /**
     * Creates an instance of the Cache class.
     */
    constructor() {
        /**
         * Maximum number of entries in the cache.
         * @private
         * @type {number}
         */
        this.maxEntries = 100;
        this.storage = new Map();
    }
    /**
     * Stores a value in the cache with an optional expiration time (TTL).
     * @param {string} key - The cache key.
     * @param {any} value - The value to store.
     * @param {number} [ttl] - Optional time-to-live in milliseconds.
     */
    set(key, value, ttl) {
        const expires = ttl ? Date.now() + ttl : null;
        this.storage.set(key, { value, expires });
        // Remove oldest entries if cache size exceeds limit
        if (this.storage.size > this.maxEntries) {
            this.evictOldest();
        }
    }
    /**
     * Retrieves a value from the cache if it is still valid.
     * @param {string} key - The cache key.
     * @returns {any | null} - The cached value or null if expired/not found.
     */
    get(key) {
        const entry = this.storage.get(key);
        if (!entry)
            return null;
        if (entry.expires && Date.now() > entry.expires) {
            this.remove(key);
            return null;
        }
        return entry.value;
    }
    /**
     * Removes a specific cache entry.
     * @param {string} key - The cache key to remove.
     */
    remove(key) {
        this.storage.delete(key);
    }
    /**
     * Clears the entire cache.
     */
    clear() {
        this.storage.clear();
    }
    /**
     * Removes the oldest entry when the cache exceeds its size limit.
     * @private
     */
    evictOldest() {
        const firstKey = this.storage.keys().next().value;
        if (firstKey)
            this.remove(firstKey);
    }
}
// Global cache instance
const globalCache = new Cache();
/**
 * @typedef {Object} CacheAPI
 * @property {function(string, number=): Promise<any>} getJSON - Fetches JSON data with caching support.
 * @property {function(string, number=): Promise<string>} getText - Fetches raw text data with caching support.
 */
/**
 * @namespace EltheonJS.cache.api
 * @memberof EltheonJS.cache
 * @type {CacheAPI}
 */
const apiCache = {
    /**
     * Fetches JSON data with caching support.
     * @param {string} url - The API endpoint URL.
     * @param {number} [ttl=60000] - Time-to-live for the cache entry in milliseconds.
     * @returns {Promise<any>} - The API response data.
     */
    getJSON(url_1) {
        return __awaiter$3(this, arguments, void 0, function* (url, ttl = 60000) {
            const cachedData = globalCache.get(url);
            if (cachedData)
                return cachedData;
            const data = yield api.getJSON(url);
            globalCache.set(url, data, ttl);
            return data;
        });
    },
    /**
     * Fetches raw text data with caching support.
     * @param {string} url - The API endpoint URL.
     * @param {number} [ttl=60000] - Time-to-live for the cache entry in milliseconds.
     * @returns {Promise<string>} - The raw text response.
     */
    getText(url_1) {
        return __awaiter$3(this, arguments, void 0, function* (url, ttl = 60000) {
            const cachedData = globalCache.get(url);
            if (cachedData)
                return cachedData;
            const data = yield api.getText(url);
            globalCache.set(url, data, ttl);
            return data;
        });
    },
};
/**
 * @typedef {Object} CacheTemplating
 * @property {function(string, Object, number=): string} render - Renders a template with caching support.
 */
/**
 * @namespace EltheonJS.cache.templating
 * @memberof EltheonJS.cache
 * @type {CacheTemplating}
 */
const templatingCache = {
    /**
     * Renders a template with caching support.
     * @param {string} templateId - The template identifier.
     * @param {object} data - The data to inject into the template.
     * @param {number} [ttl=300000] - Time-to-live for the cached template in milliseconds.
     * @returns {string} - The rendered template as an HTML string.
     */
    render(templateId, data, ttl = 300000) {
        let cachedTemplate = globalCache.get(templateId);
        if (!cachedTemplate) {
            cachedTemplate = templating.render(templateId, data);
            globalCache.set(templateId, cachedTemplate, ttl);
        }
        return templating.render(cachedTemplate, data);
    },
};
/**
 * @typedef {Object} CacheModule
 * @property {function(string, any, number=)} set - Stores a value in the cache.
 * @property {function(string): any} get - Retrieves a cached value.
 * @property {function(string)} remove - Removes a cache entry.
 * @property {function()} clear - Clears the entire cache.
 * @property {CacheAPI} api - API caching wrapper.
 * @property {CacheTemplating} templating - Template caching wrapper.
 */
/**
 * Main cache object combining standard caching functionalities and specific API/templating caches.
 * @namespace EltheonJS.cache
 * @type {CacheModule}
 */
const cache = Object.assign(globalCache, { api: apiCache, templating: templatingCache });

/**
 * Lifecycle management for TemplateElements.
 * Enables registration and triggering of lifecycle hooks like "onMount" or "onDestroy".
 * @module lifecycle
 */
class Lifecycle {
    /**
     * Constructs a Lifecycle instance for a specific TemplateElement.
     * @param {TemplateElement} owner - The template element this lifecycle is attached to.
     */
    constructor(owner) {
        this.hooks = new Map();
        this.owner = owner;
    }
    /**
     * Returns a standardized lifecycle event ID.
     * This helps maintain consistency when triggering or subscribing to events.
     * @param {string} hook - The lifecycle event (e.g., "onMount", "onDestroy").
     * @param {string} [ownerId] - Optional owner ID (e.g., template ID).
     * @returns {string} The formatted event ID (e.g., "lifecycle:onMount:myTemplate").
     */
    static getIdByHook(hook, ownerId) {
        return `lifecycle:${hook}${ownerId ? `:${ownerId}` : ""}`;
    }
    /**
     * Registers a function for a lifecycle event.
     * @param {string} hook - The event name (e.g., "onMount").
     * @param {EventCallback} callback - The function to execute.
     */
    on(hook, callback) {
        if (!this.hooks.has(hook)) {
            this.hooks.set(hook, []);
        }
        this.hooks.get(hook).push(callback);
        const eventId = Lifecycle.getIdByHook(hook, this.owner.templateName);
        globalEventBus.subscribe(eventId, callback);
    }
    /**
     * Triggers a lifecycle event, executing all registered callbacks.
     * @param {string} hook - The event name (e.g., "onMount").
     * @param {...any} args - Additional arguments passed to the callbacks.
     */
    trigger(hook, ...args) {
        if (this.hooks.has(hook)) {
            this.hooks.get(hook).forEach(cb => cb(...args));
        }
        const eventId = Lifecycle.getIdByHook(hook, this.owner.templateName);
        globalEventBus.emit(eventId, ...args);
    }
}

var __awaiter$2 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * @typedef {Object.<string, function(Event, DomElement): void>} EventMap
 * An object containing event handlers linked via `data-tpl-event`.
 */
/**
 * Extended templating module for EltheonJS Full.
 * Adds API-based template loading and registration.
 * @module templatingExt
 */
class TemplatingExt {
    constructor() {
        /**
         * Stores all loaded templates, including API-loaded and static templates.
         * @type {Record<string, TemplateElementExt>}
         */
        this.templates = {};
    }
    /**
     * Initializes the templating module by collecting all elements with `data-tpl`
     * from the DOM and storing them as clones.
     */
    init() {
        const templateNodes = document.querySelectorAll("[data-tpl]");
        templateNodes.forEach((node) => {
            var _a;
            const name = node.getAttribute("data-tpl");
            let element = null;
            if (!name)
                return;
            // <template>
            if (node instanceof HTMLTemplateElement) {
                // Klone den inneren Fragment-Content (NICHT das Template selbst!)
                const fragment = node.content.cloneNode(true);
                element = fragment.firstElementChild;
            }
            // <script type="text/template">
            else if (node instanceof HTMLScriptElement &&
                node.type === "text/template") {
                const container = document.createElement("div");
                container.innerHTML = (_a = node.textContent) !== null && _a !== void 0 ? _a : "";
                element = container.firstElementChild;
            }
            // Sonstige (z.B. <div data-tpl>)
            else if (node instanceof HTMLElement) {
                element = node.cloneNode(true);
            }
            if (element) {
                this.templates[name] = new TemplateElementExt(element);
            }
            node.remove();
        });
    }
    /**
    * Checks whether a template with the specified name is registered.
    * This method allows external modules (e.g., SPA routing) to determine
    * if a template is already loaded (either from inline registration or via API).
    *
    * @param {string} name - The unique name of the template (e.g., the page or component name).
    * @returns {boolean} Returns `true` if the template exists in the registry, otherwise `false`.
    *
    * @example
    * if (templatingExt.hasTemplate("settings")) {
    *     // Safe to render the "settings" template
    * }
    */
    hasTemplate(name) {
        return !!this.templates[name];
    }
    /**
     * Loads templates dynamically from an API endpoint.
     * Uses caching to prevent redundant requests.
     * @param {string} url - The API endpoint to fetch the template from.
     * @returns {Promise<boolean>} Resolves to `true` if loaded successfully, `false` otherwise.
     */
    loadFromApi(url) {
        return __awaiter$2(this, void 0, void 0, function* () {
            try {
                const templateHtml = yield cache.api.getText(url);
                if (!templateHtml)
                    throw new Error(`Failed to load templates from ${url}`);
                // Temporäre Container-DIV erstellen und Templates parsen
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = templateHtml.trim();
                const templateNodes = tempDiv.querySelectorAll("[data-tpl]");
                templateNodes.forEach((node) => {
                    const name = node.getAttribute("data-tpl");
                    if (name && !this.templates[name]) {
                        this.templates[name] = new TemplateElementExt(node.cloneNode(true));
                    }
                });
                return true;
            }
            catch (error) {
                console.error("TemplatingExt: Error loading templates from API", error);
                return false;
            }
        });
    }
    /**
     * Renders an API-loaded or local template as a `TemplateElementExt`.
     * If the template is not available, it tries to fetch it via API.
     * @param {string} templateName - The name of the template.
     * @param {Record<string, any>} [values={}] - Key-value object for placeholders.
     * @param {EventMap} [eventMap] - Optional event handlers for `data-tpl-event`.
     * @returns {TemplateElementExt | null} - A newly created `TemplateElementExt` or `null` if the template is missing.
     */
    render(templateName, values = {}, eventMap) {
        const template = this.templates[templateName];
        if (!template) {
            logger.warn(`Templating: Template '${templateName}' not found.`);
            return new TemplateElementExt(document.createElement("div")).setText("Template not found.");
        }
        const clone = new TemplateElementExt(template.element.cloneNode(true));
        clone.templateName = templateName;
        clone.applyTemplate(values, eventMap);
        return clone;
    }
    /**
     * Renders a template and appends it to a container.
     * Supports both API-loaded and locally stored templates.
     * @param {string} containerSelector - CSS selector for the target container.
     * @param {string} templateName - The name of the template.
     * @param {Record<string, any>} [values={}] - Data for template placeholders.
     * @returns {Promise<void>} - No return value, modifies the DOM directly.
     */
    appendTo(containerSelector_1, templateName_1) {
        return __awaiter$2(this, arguments, void 0, function* (containerSelector, templateName, values = {}) {
            const container = document.querySelector(containerSelector);
            if (!container) {
                console.warn(`TemplatingExt: Container '${containerSelector}' not found.`);
                return;
            }
            const element = yield this.render(templateName, values);
            if (element) {
                container.appendChild(element.element);
            }
            else {
                console.warn(`TemplatingExt: Failed to append template '${templateName}'`);
            }
        });
    }
}
/**
 * Extended version of TemplateElement with lifecycle support.
 * @class TemplateElementExt
 */
class TemplateElementExt extends TemplateElement {
    /**
 * Creates a new `TemplateElementExt` instance.
 * @param {HTMLElement} element - The HTML element representing the template.
 */
    constructor(element) {
        super(element);
        this.lifecycle = new Lifecycle(this);
    }
}
const templatingExt = new TemplatingExt();

/**
 * State management module for EltheonJS SPA
 * Provides a reactive global state, optional persistence, and subscription to state changes.
 * @module state
 * @author Reemon Köppen
 * @version 2.0.0
 */
var __awaiter$1 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Internal map for all subscription listeners by key.
 * @private
 */
const listeners = {};
/**
 * Internal map of persistence settings (per key).
 * @private
 */
const persistence = {};
/**
 * The root global state object. All app-wide data is stored here.
 * Reactive via Proxy. Arbitrary nesting is allowed.
 * @namespace state.global
 */
const globalState = {};
/**
 * Holds references to all active bind proxies for sync between state and UI.
 * Indexed by key (z. B. Seitenname oder State-Key).
 * @type {Record<string, any>}
 */
const activeBindModels = {};
// Pro Key: Sync-Config & Driver
const syncConfigs = {};
const debouncers = {};
function removeInternals(obj) {
    if (typeof obj !== "object" || obj === null)
        return obj;
    const clean = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
        if (key === "modelCallbacks" ||
            typeof obj[key] === "function")
            continue;
        clean[key] = removeInternals(obj[key]);
    }
    // Symbole (wie PROXY_MARKER) entfernen
    Object.getOwnPropertySymbols(obj).forEach(() => { });
    return clean;
}
/**
 * Utility to emit state change events and notify listeners.
 * Now also bridges to modelCallbacks for bind.js compatibility.
 * @private
 * @param {string} key - The top-level key that changed.
 * @param {any} value - The new value for that key.
 */
function notifyChange(key, value, propertyName, newValue) {
    // State-Layer-Subscriber
    if (listeners[key]) {
        listeners[key].forEach(cb => cb(value));
    }
    // EventBus
    globalEventBus.emit(`state:${key}:change`, value);
    logger.info(`[state] Changed: ${key}`, value);
    // Modell-Callbacks (bind.js)
    if (value && value.modelCallbacks) {
        for (const prop in value.modelCallbacks) {
            if (Object.prototype.hasOwnProperty.call(value.modelCallbacks, prop) &&
                Array.isArray(value.modelCallbacks[prop])) {
                value.modelCallbacks[prop].forEach((cb) => {
                    try {
                        cb(value[prop]);
                    }
                    catch (e) {
                        logger.warn("modelCallback error", e);
                    }
                });
            }
        }
    }
    // Bind-Proxy aktualisieren (nur falls unterschiedliche Referenz/Wert)
    const bindProxy = state._activeBindModels[key];
    if (bindProxy && bindProxy !== value) {
        for (const prop in value) {
            // Falls Wert unterschiedlich, setzen (und Callback triggern)
            if (Object.prototype.hasOwnProperty.call(bindProxy, prop) &&
                bindProxy[prop] !== value[prop]) {
                bindProxy[prop] = value[prop];
            }
        }
    }
    //console.error(persistence, key, persistence[key]);
    // Speichern, wenn persistent
    if (persistence[key]) {
        const cleaned = removeInternals(value);
        //console.error(key, persistence[key], value, cleaned);
        storage[persistence[key]].set(`state.${key}`, JSON.parse(JSON.stringify(cleaned)));
    }
}
function wrapWithTopLevelNotify(key, value) {
    return bind.createReactiveModel(value, null, "", () => {
        notifyChange(key, state.global[key]);
    });
}
function injectSyncMethods(key) {
    if (!syncConfigs[key])
        return;
    const driver = syncConfigs[key].driver || defaultRestDriver;
    state.global[key].save = function () {
        const urlOpt = syncConfigs[key].url;
        const url = typeof urlOpt === "function"
            ? urlOpt(state.global[key].id)
            : urlOpt;
        const ctx = {
            key,
            state: removeInternals(state.global[key]),
            id: state.global[key].id,
            url,
            method: syncConfigs[key].method,
            headers: syncConfigs[key].headers,
            options: syncConfigs[key]
        };
        const saveFn = driver.save || defaultRestDriver.save;
        if (!saveFn)
            throw new Error("No save driver defined!");
        return saveFn(ctx);
    };
    state.global[key].load = function (id) {
        const urlOpt = syncConfigs[key].url;
        const url = typeof urlOpt === "function"
            ? urlOpt(id !== null && id !== void 0 ? id : state.global[key].id)
            : urlOpt;
        const ctx = {
            key,
            state: state.global[key],
            id: id !== null && id !== void 0 ? id : state.global[key].id,
            url,
            method: syncConfigs[key].method,
            headers: syncConfigs[key].headers,
            options: syncConfigs[key]
        };
        const loadFn = driver.load || defaultRestDriver.load;
        if (!loadFn)
            throw new Error("No load driver defined!");
        return loadFn(ctx)
            .then((data) => {
            if (typeof data === "object") {
                state.global[key] = wrapWithTopLevelNotify(key, data);
                injectSyncMethods(key); // <-- Methoden wieder injizieren!
                notifyChange(key, state.global[key]);
            }
            return state.global[key];
        });
    };
    state.global[key].remove = function (id) {
        const urlOpt = syncConfigs[key].url;
        const url = typeof urlOpt === "function"
            ? urlOpt(id !== null && id !== void 0 ? id : state.global[key].id)
            : urlOpt;
        const ctx = {
            key,
            state: state.global[key],
            id: id !== null && id !== void 0 ? id : state.global[key].id,
            url,
            method: syncConfigs[key].method,
            headers: syncConfigs[key].headers,
            options: syncConfigs[key]
        };
        const removeFn = driver.remove || defaultRestDriver.remove;
        if (!removeFn)
            throw new Error("No remove driver defined!");
        return removeFn(ctx);
    };
}
const defaultRestDriver = {
    load(_a) {
        return __awaiter$1(this, arguments, void 0, function* ({ url, headers }) {
            return api.getJSON(url, headers);
        });
    },
    save(_a) {
        return __awaiter$1(this, arguments, void 0, function* ({ url, state, method, headers }) {
            //if (method === "PATCH") return api.patchJSON(url, state, headers);
            if (method === "PUT")
                return api.putJSON(url, state, headers);
            return api.postJSON(url, state, headers);
        });
    },
    remove(_a) {
        return __awaiter$1(this, arguments, void 0, function* ({ url, headers }) {
            return api.deleteJSON(url, headers);
        });
    }
};
/**
 * The state module API.
 * @namespace state
 */
const state = {
    /**
     * The global app-wide reactive state object.
     * All persistent/shared data is stored under this key.
     * @type {Record<string, any>}
     * @memberof state
     */
    global: new Proxy(globalState, {
        set(obj, prop, value) {
            // Nicht überschreiben, wenn exakt der gleiche Wert!
            if (obj[prop] === value)
                return true;
            // Falls Proxy, nicht erneut wrappen!
            obj[prop] = wrapWithTopLevelNotify(prop, value); //isReactive(value) ? value : makeReactive(prop, value);
            //notifyChange(prop, obj[prop]);
            return true;
        },
        get(obj, prop) {
            return obj[prop];
        }
    }),
    _activeBindModels: activeBindModels,
    /**
     * Subscribe to changes of a specific top-level key in state.global.
     * @param {string} key - The top-level key to watch (e.g. "user").
     * @param {StateChangeCallback} callback - Function to call on changes.
     * @memberof state
     * @example
     * state.subscribe("user", user => { ... });
     */
    subscribe(key, callback) {
        if (!listeners[key])
            listeners[key] = new Set();
        listeners[key].add(callback);
    },
    /**
     * Unsubscribe from changes of a specific top-level key.
     * @param {string} key - The top-level key.
     * @param {StateChangeCallback} callback - Function reference passed to subscribe().
     * @memberof state
     * @example
     * state.unsubscribe("user", myHandler);
     */
    unsubscribe(key, callback) {
        if (listeners[key])
            listeners[key].delete(callback);
    },
    /**
     * Enable persistence for a given top-level key in state.global.
     * Restores existing value from storage if present.
     * @param {string} key - The key to persist (e.g. "user").
     * @param {StatePersistenceType} [type="local"] - Storage driver to use.
     * @memberof state
     * @example
     * state.persist("user", "session");
     */
    persist(key_1) {
        return __awaiter$1(this, arguments, void 0, function* (key, type = "local") {
            persistence[key] = type;
            // Restore existing value
            const val = yield storage[type].get(`state.${key}`);
            if (val !== null && typeof val !== "undefined") {
                // NEU: Immer neue Proxy-Referenz
                state.global[key] = wrapWithTopLevelNotify(key, val);
                injectSyncMethods(key);
                notifyChange(key, state.global[key]);
            }
        });
    },
    /**
     * Reset a top-level key in the state to empty or default.
     * @param {string} key - The key to reset.
     * @memberof state
     */
    reset(key) {
        state.global[key] = {};
        notifyChange(key, state.global[key]);
    },
    /**
     * Restore persisted value for a given key from storage.
     * @param {string} key - The key to restore.
     * @memberof state
     */
    restore(key) {
        return __awaiter$1(this, void 0, void 0, function* () {
            if (!persistence[key])
                return;
            const val = yield storage[persistence[key]].get(`state.${key}`);
            if (val !== null && typeof val !== "undefined") {
                state.global[key] = wrapWithTopLevelNotify(key, val);
                injectSyncMethods(key);
                notifyChange(key, state.global[key]);
            }
        });
    },
    /**
 * Synchronizes a state key with a backend API (REST by default).
 * Adds .save(), .load(), .remove() to the state model.
 * @param {string} key - The state key (e.g. "user").
 * @param {SyncOptions} options - Options: url, method, driver, debounce, auto.
 */
    sync(key, options) {
        return __awaiter$1(this, void 0, void 0, function* () {
            syncConfigs[key] = Object.assign({ method: "PATCH", auto: true, debounce: 800 }, options);
            injectSyncMethods(key);
            // Option: initiales Laden (nur wenn explizit gesetzt)
            if (options.auto && options.method !== "POST") {
                yield state.global[key].load();
            }
            // Auto-Save via Debounce, wenn aktiviert
            if (syncConfigs[key].auto) {
                state.subscribe(key, (value) => {
                    if (debouncers[key])
                        clearTimeout(debouncers[key]);
                    debouncers[key] = setTimeout(() => {
                        state.global[key].save();
                    }, syncConfigs[key].debounce);
                });
            }
        });
    }
};

// spa.ts
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Internal class that manages SPA page navigation, rendering, and lifecycle.
 * Not exposed directly; use the exported `spa` API instead.
 */
class SPARuntime {
    /**
     * Constructs a new SPA runtime and registers page definitions.
     * @param {SPAConfig} config - The SPA configuration.
     */
    constructor(config) {
        /**
         * All registered pages, keyed by their name.
         * @private
         */
        this.pages = new Map();
        /**
     * Determines whether all remote templates should be preloaded (eager loading)
     * during SPA initialization. If set to `true`, all remote templates defined in the SPAConfig
     * will be fetched and registered before the first route is rendered.
     * If set to `false` (default), remote templates are loaded on demand ("lazy loading")
     * the first time their page is visited.
     *
     * This flag is set automatically from the `preloadTemplates` property of SPAConfig.
     *
     * @type {boolean}
     * @default false
     *
     * @example
     * // Eager loading (all templates loaded at startup)
     * const runtime = new SPARuntime({ pages, preloadTemplates: true });
     *
     * // Lazy loading (templates loaded only when needed)
     * const runtime = new SPARuntime({ pages });
     */
        this.preloadTemplates = false;
        config.pages.forEach(p => this.pages.set(p.name, p));
        this.preloadTemplates = !!config.preloadTemplates;
        logger.addHandler(consoleHandler);
        window.addEventListener('hashchange', this.route.bind(this));
    }
    logState() {
        var _a, _b;
        logger.info("[SPA] Debug State", {
            currentPage: this.currentPage,
            allPages: Array.from(this.pages.keys()),
            model: (_a = this.currentPage) === null || _a === void 0 ? void 0 : _a.model
        });
        console.group("[SPA] State");
        console.log("Current Page:", this.currentPage);
        console.log("All Pages:", Array.from(this.pages.keys()));
        console.log("Current Model:", (_b = this.currentPage) === null || _b === void 0 ? void 0 : _b.model);
        console.groupEnd();
    }
    makeBindableModel(stateModel) {
        if (typeof stateModel !== "object" || stateModel === null)
            return stateModel;
        const bindingProxy = {};
        for (const key of Object.keys(stateModel)) {
            Object.defineProperty(bindingProxy, key, {
                get: () => stateModel[key],
                set: v => { stateModel[key] = v; },
                enumerable: true,
                configurable: true
            });
        }
        // Trick: modelCallbacks am Bind-Proxy, aber Referenz im State merken!
        Object.defineProperty(bindingProxy, "__stateRef", {
            value: stateModel,
            enumerable: false,
            configurable: false,
            writable: false,
        });
        // modelCallbacks werden durch bind.applyBindings hier hinzugefügt!
        return bindingProxy;
    }
    /**
     * Starts the SPA, rendering the initial route.
     */
    start() {
        this.route();
    }
    /**
     * Handles hash-based routing, page switching, lifecycle, and rendering.
     * Called automatically on hash change.
     * @private
     */
    route() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            let hash = window.location.hash.replace(/^#\/?/, '');
            let page;
            if (hash) {
                page = this.pages.get(hash) || this.pages.get('404');
            }
            else {
                // Kein Hash: Default-Page suchen
                page = Array.from(this.pages.values()).find(p => p.default);
                if (!page)
                    page = this.pages.get('home') || Array.from(this.pages.values())[0];
            }
            if (!page) {
                logger.warn(`Page not found for route: ${hash}`);
                debug$1.handleLog("spa", "warn", `SPA: Page not found for route ${hash}`);
                return;
            }
            // Unmount previous page
            if (this.currentPage && this.currentPage.name !== page.name) {
                const oldPageDef = this.pages.get(this.currentPage.name);
                // 1. Template-Lifecycle onDestroy
                if (this.currentPage.templateInstance && this.currentPage.templateInstance.lifecycle) {
                    this.currentPage.templateInstance.lifecycle.trigger("onDestroy", this.currentPage);
                }
                // 2. Page-Callback onDestroy (wie gehabt)
                if (oldPageDef && oldPageDef.onDestroy) {
                    logger.info(`[SPA] Destroying page: ${this.currentPage.name}`);
                    debug$1.handleLog("spa", "debug", `[SPA] onDestroy: ${this.currentPage.name}`, this.currentPage);
                    oldPageDef.onDestroy(this.currentPage);
                }
            }
            // Template laden (je nach Preload-Modus)
            const el = document.getElementById('spa-root');
            let templateInstance = null;
            // Prüfe, ob das Template remote ist (URL)
            const isRemoteTemplate = typeof page.template === "string" &&
                (page.template.startsWith("/") || page.template.startsWith("http"));
            // Nur nachladen, wenn NICHT preload und noch nicht im Register!
            if (isRemoteTemplate &&
                !templatingExt.hasTemplate(page.name) &&
                !this.preloadTemplates) {
                yield templatingExt.loadFromApi(page.template);
            }
            if (el) {
                templateInstance = templatingExt.render(page.name, (_a = page.model) !== null && _a !== void 0 ? _a : {});
                el.innerHTML = "";
                if (templateInstance) {
                    el.appendChild(templateInstance.element);
                    templateInstance.lifecycle.trigger("onMount", { page, el, model: page.model });
                }
                else {
                    el.innerHTML = "<h2>Template not found.</h2>";
                }
            }
            const ctx = { name: page.name, model: (_b = page.model) !== null && _b !== void 0 ? _b : {}, el, templateInstance };
            if (page.onMount) {
                logger.info(`[SPA] Mounting page: ${page.name}`);
                debug$1.handleLog("spa", "debug", `[SPA] onMount: ${page.name}`, ctx);
                page.onMount(ctx);
            }
            // Data binding
            if (window.EltheonJS && window.EltheonJS.bind) {
                logger.info(`[SPA] Applying bindings for page: ${page.name}`);
                const bindModel = this.makeBindableModel(ctx.model);
                // <-- NEU: Proxy global speichern, nach State-Key
                state._activeBindModels[page.name] = bindModel;
                bind.applyBindings(bindModel);
            }
            this.currentPage = ctx;
        });
    }
}
/**
 * The main SPA API for EltheonJS.
 * Use this to initialize the SPA with your page definitions.
 */
let runtime = undefined;
const spa = {
    /**
     * Initializes the SPA runtime with your pages.
     * @param {SPAConfig} config - The SPA configuration object.
     * @returns {SPARuntime} - The runtime instance for advanced use.
     *
     * @example
     * spa.init({ pages: [...] });
     */
    init: (config) => __awaiter(void 0, void 0, void 0, function* () {
        templatingExt.init();
        if (config.preloadTemplates) {
            // Alle Remote-Templates vorladen
            const remoteTemplates = config.pages
                .filter(page => typeof page.template === "string" &&
                (page.template.startsWith("/") || page.template.startsWith("http")))
                .map(page => templatingExt.loadFromApi(page.template));
            yield Promise.all(remoteTemplates);
        }
        runtime = new SPARuntime(config);
        runtime.start();
        return runtime;
    }),
    /**
     * Outputs the current SPA state to logger and console.
     */
    logState: () => { var _a; return (_a = runtime === null || runtime === void 0 ? void 0 : runtime.logState) === null || _a === void 0 ? void 0 : _a.call(runtime); }
};

/**
 * Main library for Eltheon projects, serving as a central access point for various modules.
 * @module EltheonJSFull
 * @exports EltheonJS
 * @author Reemon Köppen
 * @version 2.0.0
 */
/**
 * Main object containing all modules for Eltheon projects.
 * @namespace EltheonFull
 */
const EltheonFull = Object.assign(Object.assign({}, EltheonCore), { 
    /**
     * Debugger
     * @memberof EltheonFull
     */
    debug: debug$1,
    /**
     * Storage
     * @memberof EltheonFull
     */
    storage,
    /**
     * Eventbus
     * @memberof EltheonFull
     */
    events: globalEventBus,
    /**
     * Cache
     * @memberof EltheonFull
     */
    cache,
    /**
     * Lifecycle
     * @memberof EltheonFull
     */
    Lifecycle, 
    /**
     * SPA Templating Engine
     * @memberof EltheonFull
     */
    templatingExt: templatingExt, 
    /**
     * SPA Module
     * @memberof EltheonFull
     */
    spa: spa, 
    /**
     * State Management
     * @memberof EltheonFull
     */
    state: state });
if (typeof globalThis !== "undefined") {
    globalThis.EltheonJS = EltheonFull;
}
else if (typeof window !== "undefined") {
    window.EltheonJS = EltheonFull;
}

export { EltheonFull as default };
//# sourceMappingURL=eltheonFull.esm.js.map
