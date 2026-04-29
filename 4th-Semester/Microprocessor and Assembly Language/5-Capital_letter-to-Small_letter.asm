; Capital Letter to Small Letter

.MODEL SMALL
.STACK 100H
.DATA

.CODE
MEHEDI PROC
    MOV AX, @DATA
    MOV DS, AX

    MOV AH, 01H      ; read a capital letter
    INT 21H          ; input stored in AL

    ADD AL, 20H      ; convert to small letter
    MOV BL, AL       ; save small letter in BL

    MOV DL, ' '      ; display space
    MOV AH, 02H
    INT 21H

    MOV DL, BL       ; display small letter
    MOV AH, 02H
    INT 21H

    MOV AH, 4CH      ; exit program
    INT 21H
MEHEDI ENDP
END MEHEDI