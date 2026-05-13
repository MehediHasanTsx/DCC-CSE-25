;Display all English Alphabet

.model small
.stack 100h
.data

.code
main proc
    mov ax, @data
    mov ds, ax

    mov dl, 'a'      ; start with A

print:
    mov ah, 02h      ; DOS function to display character
    int 21h

    inc dl           ; next letter
    cmp dl, 'z' + 1  ; check if past Z
    jne print

    mov ah, 4ch      ; exit program
    int 21h
main endp
end main