;Display all English Alphabet

.MODEL SMALL
.STACK 100H
.DATA

.CODE
MEHEDI PROC
    MOV AX, @DATA
    MOV DS, AX

    MOV DL, 'A'      ; start with A

PRINT:
    MOV AH, 02H      ; DOS function to display character
    INT 21H

    INC DL           ; next letter
    CMP DL, 'Z' + 1  ; check if past Z
    JNE PRINT

    MOV AH, 4CH      ; exit program
    INT 21H
MEHEDI ENDP
END MEHEDI