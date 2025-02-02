export function interpretStyle(style: string) {
    let split = style.split(" ");
    split.forEach((attr, index) => {
        if (attr.includes("sp-"))
            split[index] = `var(--spacing-${attr.split('-').at(-1)})`;
    });
    return split.join(" ");
}

export type ClassNamesObject = {
    [key: string]: boolean | { subClass: boolean };
};

export function classNames(classes: ClassNamesObject): string {
    let result = "";
    Object.keys(classes).map((className) => {
        if (classes[className] instanceof Object) {
            const { subClass } = classes[className] as { subClass: boolean };
            if (subClass) result = `${result}-${className}`;
        } else if (classes[className] != false) {
            result = `${result} ${className}`;
        }
    });
    return result;
}

export const parseClass = (defaultClass: string, className: string): string => {
    let result = className;
    if (className && className.length > 3) {
      if (className.substring(0, 3) == "...") {
        result = `${defaultClass} ${className.substring(3).trim()}`;
      }
    }
    return result;
  };

// export const _var = (str: string) => `var(${str})`;