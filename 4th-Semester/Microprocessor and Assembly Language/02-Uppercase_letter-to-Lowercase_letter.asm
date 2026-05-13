; Capital Letter to Small Letter

.model small
.stack 100h
.data

.code
main proc
    mov ax, @data
    mov ds, ax

    mov ah, 01h      ; read a capital letter
    int 21h          ; input stored in AL

    add al, 20h      ; convert to small letter
    mov bl, al       ; save small letter in BL

    mov dl, ' '      ; display space
    mov ah, 02h
    int 21h

    mov dl, bl       ; display small letter
    mov ah, 02h
    int 21h

    mov ah, 4ch      ; exit program
    int 21h
main endp
end main