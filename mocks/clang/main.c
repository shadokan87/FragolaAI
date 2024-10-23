#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    // Example usage of strlen
    char *str = "Hello, world!";
    size_t len = strlen(str);
    printf("Length of \"%s\" is %zu\n", str, len);

    // Example usage of strdup
    char *copy = strdup(str);
    printf("Copy of str: %s\n", copy);

    // Free the dynamically allocated memory
    free(copy);

    return 0;
}

size_t strlen(const char *str) {
    size_t len = 0;
    while (*str != '\0') {
        len++;
        str++;
    }
    return len;
}

char *strdup(const char *str) {
    size_t len = strlen(str) + 1; // +1 for the null terminator
    char *copy = (char *)malloc(len * sizeof(char));
    if (copy == NULL) {
        return NULL; // Allocation failed
    }
    memcpy(copy, str, len); // Copy the string including the null terminator
    return copy;
}
