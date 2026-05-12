.model small
.stack 100h

.data
msg db 'Mehedi Hasan$'

.code

display macro str
    mov ah, 09h
    lea dx, str
    int 21h

    mov ah, 02h
    mov dl, 0dh
    int 21h

    mov dl, 0ah
    int 21h

endm

main proc
    mov ax, @data
    mov ds, ax

    mov cx, 10

again: 
    display msg
    loop again

    mov ah, 4ch
    int 21h

main endp
end main